const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withOptionalHardware(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    const features = [
      "android.hardware.screen.portrait",
      "android.hardware.wifi"
    ];

    manifest["uses-feature"] ||= [];

    for (const name of features) {
      const existing = manifest["uses-feature"].find(
        (feature) => feature.$?.["android:name"] === name
      );

      if (existing) {
        existing.$["android:required"] = "false";
      } else {
        manifest["uses-feature"].push({
          $: {
            "android:name": name,
            "android:required": "false"
          }
        });
      }
    }

    return config;
  });
};