const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const yaml = require('js-yaml');

const workflow = yaml.load(fs.readFileSync('.github/workflows/android-release.yml', 'utf8'));
const steps = workflow.jobs.build.steps;
const versionStep = steps.find(step => step.id === 'release-version');
const syncStep = steps.find(step => step.name === 'Sync released version back to app.json');

function version({ base = '1.0.1', code = 2, savedCode = code, tag } = {}) {
  let config;
  let output;
  const script = versionStep.run.split("node <<'NODE'\n")[1].split('\nNODE')[0];
  vm.runInNewContext(script, {
    require: () => ({
      readFileSync: () => JSON.stringify({ expo: { version: base, android: { versionCode: code } } }),
      writeFileSync: (_, content) => { config = JSON.parse(content); },
      appendFileSync: (_, content) => { output = content; },
    }),
    process: { env: { SAVED_ANDROID_VERSION_CODE: String(savedCode), GITHUB_REF_TYPE: tag ? 'tag' : 'branch', GITHUB_REF_NAME: tag, GITHUB_OUTPUT: 'output' } },
    console: { log() {} },
  });
  return { config, output };
}

test('manual builds advance the saved patch once and export the built values', () => {
  const result = version();
  assert.equal(result.config.expo.version, '1.0.2');
  assert.equal(result.config.expo.android.versionCode, 3);
  assert.equal(result.output, 'version=1.0.2\nversion-code=3\n');
  const next = version({ base: '1.0.2', code: 3 });
  assert.equal(next.config.expo.version, '1.0.3');
  assert.equal(next.config.expo.android.versionCode, 4);
});

test('tag builds use the tag name and code advances past a larger saved code', () => {
  const result = version({ tag: 'v2.3.4', code: 2, savedCode: 50 });
  assert.equal(result.config.expo.version, '2.3.4');
  assert.equal(result.config.expo.android.versionCode, 51);
  assert.throws(() => version({ tag: 'vbad' }));
  assert.throws(() => version({ code: 2100000000 }));
});

async function sync({ currentVersion = '1.0.1', currentCode = 2, conflict = false, failure } = {}) {
  const writes = [];
  let reads = 0;
  const script = new (Object.getPrototypeOf(async function () {}).constructor)(
    'github', 'context', 'core', 'process', 'Buffer', syncStep.with.script,
  );
  await script({ rest: { repos: {
    getContent: async () => ({ data: {
      sha: `sha-${++reads}`,
      content: Buffer.from(JSON.stringify({ expo: {
        version: currentVersion, android: { versionCode: currentCode, package: 'preserved' },
        name: `Latest name ${reads}`,
      } })).toString('base64'),
    } }),
    createOrUpdateFileContents: async args => {
      writes.push(args);
      if (failure || (conflict && writes.length === 1)) throw Object.assign(new Error('write failed'), { status: failure || 409 });
    },
  } } }, { repo: { owner: 'owner', repo: 'repo' } }, { info() {}, warning() {} }, {
    env: { TARGET_BRANCH: 'main', RELEASE_VERSION: '1.0.2', RELEASE_VERSION_CODE: '20' },
  }, Buffer);
  return writes;
}

test('sync updates only version fields on the latest branch config and retries conflicts', async () => {
  const writes = await sync({ conflict: true });
  assert.equal(writes.length, 2);
  const config = JSON.parse(Buffer.from(writes[1].content, 'base64'));
  assert.equal(config.expo.version, '1.0.2');
  assert.equal(config.expo.android.versionCode, 20);
  assert.equal(config.expo.android.package, 'preserved');
  assert.equal(config.expo.name, 'Latest name 2');
  assert.equal(writes[1].sha, 'sha-2');
  assert.equal(writes[1].branch, 'main');
});

test('sync is idempotent and cannot overwrite a newer release', async () => {
  assert.equal((await sync({ currentVersion: '1.0.2', currentCode: 20 })).length, 0);
  assert.equal((await sync({ currentCode: 25 })).length, 0);
  assert.equal((await sync({ currentVersion: '2.0.0' })).length, 0);
  await assert.rejects(sync({ failure: 403 }), /write failed/);
});

test('sync runs after artifact upload and release publishing with write permission', () => {
  assert.equal(steps.at(-1), syncStep);
  assert.equal(syncStep.if, '${{ success() }}');
  assert.ok(steps.indexOf(syncStep) > steps.findIndex(step => step.id === 'release-artifacts'));
  assert.ok(steps.indexOf(syncStep) > steps.findIndex(step => step.name === 'Publish GitHub release assets'));
  assert.equal(workflow.permissions.contents, 'write');
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
});

test('a failed build consumes neither the saved patch nor the saved Android code', () => {
  const saved = { base: '1.0.1', code: 2 };
  const failedAttempt = version(saved);
  // The runner prepares a candidate; failure skips the final success-only commit.
  const retry = version(saved);
  assert.equal(retry.config.expo.version, failedAttempt.config.expo.version);
  assert.equal(retry.config.expo.android.versionCode, failedAttempt.config.expo.android.versionCode);
  assert.ok(steps.slice(0, -1).every(step => !step['continue-on-error']));
});
