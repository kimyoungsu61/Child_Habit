// Centralized sound effect playback for the JSP frontend.
(function () {
  "use strict";

  var root = document.getElementById("appRoot");
  var contextPath = typeof window.APP_CONTEXT === "string"
    ? window.APP_CONTEXT
    : (typeof window.APP_CONTEXT_PATH === "string"
      ? window.APP_CONTEXT_PATH
      : ((root && root.dataset && root.dataset.contextPath) || ""));

  var SOUND_MAP = {
    touch: "pet-touch.wav",
    praise: "pet-praise.wav",
    play: "pet-play.wav",
    magic: "pet-magic.wav",
    levelUp: "level-up.wav",
    rewardOpenLow: "reward-open-low.wav",
    rewardOpenMiddle: "reward-open-middle.wav",
    rewardOpenHigh: "reward-open-high.wav",
    rewardSuccess: "reward-success.wav"
  };

  function soundSrc(fileName) {
    return contextPath + "/assets/sounds/" + fileName;
  }

  function playSound(name) {
    var fileName = SOUND_MAP[name];
    if (!fileName) {
      console.warn("[SoundManager] Unknown sound:", name);
      return;
    }

    try {
      var audio = new Audio(soundSrc(fileName));
      audio.volume = 0.85;

      var playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function (err) {
          console.warn("[SoundManager] Playback failed (" + name + "):", err.message || err);
        });
      }
    } catch (err) {
      console.warn("[SoundManager] Audio creation failed (" + name + "):", err.message || err);
    }
  }

  window.playSound = playSound;
}());
