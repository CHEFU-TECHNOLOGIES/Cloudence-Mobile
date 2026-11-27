const { test } = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-app-module.cjs');
const hookHost = require('./hook-host.cjs');

function fixture(options = {}) {
  const host = hookHost();
  let pathname = options.pathname ?? '/';
  let account = 'a';
  let claimed = false, claims = 0;
  let readySequence = 0;
  let blocked = options.blocked ?? false;
  let usage = options.usage ?? { all: 2 * 1024 ** 3, plan: 'free' };
  const routes = [];
  const getAccessToken = async () => 'token';
  const claim = async () => { claims++; if (claimed) return false; claimed = true; return true; };
  const load = createLoader({
    react: host.react,
    'expo-image': { Image: 'Image' },
    '../../../../assets/images/subscription-cloud.png': 1,
    'lucide-react-native': { X: 'X', Crown: 'Crown', Check: 'Check' },
    'react-native': {
      AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
      Modal: 'Modal', Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View',
      StyleSheet: { create: value => value, absoluteFill: {} },
    },
    'expo-router': { usePathname: () => pathname, router: { push: value => routes.push(value) } },
    '../../../auth/SessionContext': { useSession: () => ({ user: { id: account }, getAccessToken }) },
    '../../../data/CloudenceDataProvider': { useCloudenceData: () => ({ usage, isOffline: options.offline ?? false }) },
    '../../../lib/cache/billingCache': { getCachedBillingStatus: async () => ({ enabled: options.billingEnabled ?? true }) },
    './SubscriptionPromotionProvider': { useSubscriptionPromotion: () => ({ readyUserId: options.readyUserId ?? 'a', readySequence, claim }) },
  });
  const Component = load('src/components/cloudence/subscription/SubscriptionPromotion.tsx').default;
  host.start(() => Component({ blocked }));
  return { host, routes, get claims() { return claims; }, set account(value) { account = value; }, set blocked(value) { blocked = value; }, set usage(value) { usage = value; },
    navigate(value) { pathname = value; host.render(); },
    cooldownExpired() { claimed = false; readySequence++; host.render(); } };
}

function findTextButton(node, label) {
  if (!node || typeof node !== 'object') return;
  const children = node.props?.children;
  if (node.type === 'Pressable' && children?.props?.children === label) return node;
  for (const child of Array.isArray(children) ? children.flat() : [children]) {
    const match = findTextButton(child, label);
    if (match) return match;
  }
}

test('a ready free user sees the promotion and can open the existing subscription panel', async () => {
  const f = fixture();
  const modal = await f.host.flush();
  assert.equal(modal.props.visible, true);
  assert.equal(f.claims, 1);
  findTextButton(modal, 'Upgrade to Pro').props.onPress();
  assert.equal((await f.host.flush()).props.visible, false);
  assert.equal(f.routes[0].pathname, '/profile');
  assert.equal(f.routes[0].params.subscription, '1');
  f.host.unmount();
});

test('dismissal does not show the promotion again on a later Home visit', async () => {
  const f = fixture();
  (await f.host.flush()).props.onRequestClose();
  await f.host.flush();
  f.navigate('/files');
  await f.host.flush();
  f.navigate('/');
  assert.equal((await f.host.flush()).props.visible, false);
  f.host.unmount();
});

for (const [name, options] of [
  ['paid users', { usage: { all: 50 * 1024 ** 3, plan: '50gb' } }],
  ['another screen', { pathname: '/files' }],
  ['another open dialog', { blocked: true }],
  ['offline users', { offline: true }],
  ['unavailable billing', { billingEnabled: false }],
  ['another account timer', { readyUserId: 'b' }],
]) {
  test(`promotion is deferred or skipped for ${name}`, async () => {
    const f = fixture(options);
    assert.equal((await f.host.flush()).props.visible, false);
    assert.equal(f.claims, 0);
    f.host.unmount();
  });
}

test('a busy Home screen shows the promotion after the other dialog closes', async () => {
  const f = fixture({ blocked: true });
  await f.host.flush();
  f.blocked = false;
  f.host.render();
  assert.equal((await f.host.flush()).props.visible, true);
  f.host.unmount();
});

test('changing accounts hides an already open promotion', async () => {
  const f = fixture();
  assert.equal((await f.host.flush()).props.visible, true);
  f.account = 'b';
  f.host.render();
  assert.equal((await f.host.flush()).props.visible, false);
  f.host.unmount();
});

test('a free user can see a reminder after the cooldown on the same Home visit', async () => {
  const f = fixture();
  (await f.host.flush()).props.onRequestClose();
  assert.equal((await f.host.flush()).props.visible, false);
  f.cooldownExpired();
  assert.equal((await f.host.flush()).props.visible, true);
  assert.equal(f.claims, 2);
  f.host.unmount();
});

test('upgrading to a paid plan suppresses subsequent reminders', async () => {
  const f = fixture();
  (await f.host.flush()).props.onRequestClose();
  await f.host.flush();
  f.usage = { all: 50 * 1024 ** 3, plan: '50gb' };
  f.cooldownExpired();
  assert.equal((await f.host.flush()).props.visible, false);
  assert.equal(f.claims, 1);
  f.host.unmount();
});
