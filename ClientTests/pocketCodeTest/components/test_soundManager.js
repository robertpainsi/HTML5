/// <reference path="../../qunit/qunit-1.16.0.js" />
'use strict';

QUnit.module("soundManager.js");


QUnit.test("SoundManager", function (assert) {

    //init and volume tests
    var doneWithInitTests = assert.async();


    var soundjsLoaded = function(){

        var instance = createjs.Sound.createInstance("_resources/sound/sound.mp3");
        var soundManager = new PocketCode.SoundManager("projectId",[]);

        assert.equal(instance.src, null, "Removed Sounds from createjs.Sounds on init.");
        assert.ok(soundManager._projectId = "projectId_", "SoundManager created with the correct projectId,");
        assert.ok(soundManager instanceof PocketCode.SoundManager, "instance check");

        assert.ok(createjs.Sound.isReady(), "creatjs.Sound is ready.");
        assert.ok(createjs.Sound.getVolume() === 0.7 && soundManager.volume === 70, "Volume Resets to 70% (default) on init.");

        soundManager.volume = 25;
        assert.ok(soundManager.volume.toFixed(2) == 25 && createjs.Sound.getVolume().toFixed(2) == 0.25, "Volume set and converted correctly.");

        soundManager.changeVolume(1);
        assert.ok(soundManager.volume.toFixed(2) == 26.00 && createjs.Sound.getVolume().toFixed(2) == 0.26, "Volume changed and converted correctly(+).");

        soundManager.changeVolume(-5);
        assert.ok(soundManager.volume.toFixed(2) == 21.00 && createjs.Sound.getVolume().toFixed(2) == 0.21, "Volume changed and converted correctly(-).");

        soundManager.volume = -1;
        assert.ok(soundManager.volume === 0 && createjs.Sound.getVolume() === 0, "Volume shows correct behaviour with negative input values.");

        soundManager.volume = 110;
        assert.ok(soundManager.volume === 100 && createjs.Sound.getVolume() === 1, "Volume shows correct behaviour with too large input values.");


        var invalidData = [{notUrl: "a"}];
        assert.throws(function(){new PocketCode.SoundManager("id",invalidData)}, Error, "ERROR: passed invalid arguments to Soundmanager.");

        doneWithInitTests();

        //playback tests
        var doneWithPlaybackTests = assert.async();
        var doneWithPlaybackComplete = assert.async();

        var onPlayCompleted = function(){
            assert.equal(soundManager2.activeSounds.length, 6, "Completed sound removed from active sounds.");
            doneWithPlaybackComplete();
        };


        var onFileLoaded = function(e){

            var progressIncrease = e.progress - progress;
            progress += e.progress;
            var index = expectedProgressChanges.indexOf(progressIncrease);
            if(index > -1){
                expectedProgressChanges.splice(index,1);
            }

            if(e.progress < 100)
                return;

            assert.equal(expectedProgressChanges.length, 0, "Progress increased according to passed size");

            assert.equal(soundManager.activeSounds.length, 0, "No active sounds on init.");

            soundManager2.startSound("projectId_sound");
            var soundInstance = soundManager2.activeSounds[0];
            assert.equal(soundInstance.src, "_resources/sound/sound.mp3", "Correct sound added to active sounds.");
            assert.equal(soundInstance.playState, "playSucceeded", "Sound started playing.");

            soundManager2.pauseSounds();
            assert.ok(soundInstance.paused, "Sound paused.");

            soundManager2.resumeSounds();
            assert.ok(!soundInstance.paused, "Sound resumed.");

            soundManager2.stopAllSounds();
            assert.equal(soundManager2.activeSounds.length, 0, "All sounds removed from active sounds on stopping.");
            assert.equal(soundInstance.playState, "playFinished", "Sound has been stopped.");


            var timesToPlaySound = 6;
            for(i = 0; i < timesToPlaySound; i++){
                soundManager2.startSound("projectId_sound");
            }
            soundManager2.startSound("projectId_sound2");
            soundManager2.pauseSounds();

            assert.equal(soundManager2.activeSounds[soundManager2.activeSounds.length-1].src, "_resources/sound/sound2.mp3", "Second sound added to active sounds.");
            assert.equal(soundManager2.activeSounds.length, timesToPlaySound + 1, "Multiple Soundinstances of same sound added to active sounds.");

            var allSoundsStartedPlaying = true;
            var allSoundsPaused = true;
            for (var i = 0; i < timesToPlaySound + 1; i++) {
                if (soundManager2.activeSounds[i].playState !== "playSucceeded"){
                    allSoundsStartedPlaying = false;
                }
                if (!soundManager2.activeSounds[i].paused){
                    allSoundsPaused = false;
                }
            }
            assert.ok(allSoundsStartedPlaying, "Multiple sound instances succeed at playing.");
            assert.ok(allSoundsPaused, "All sounds paused on calling pause");
            doneWithPlaybackTests();

            var soundInstance2 = soundManager2.activeSounds[0];
            soundInstance2.on("complete", onPlayCompleted);
            soundInstance2.paused = false;
        };


        var soundSrc = "_resources/sound/sound.mp3";
        var soundSrc2 = "_resources/sound/sound2.mp3";

        var progress = 0;
        var expectedProgressChanges = [60,40];

        var sounds = [{url: soundSrc, id:"sound", size:3}, {url: soundSrc2, id:"sound2", size:2}];
        var soundManager2 = new PocketCode.SoundManager("projectId", sounds);
        soundManager2.onLoadingProgress.addEventListener(new SmartJs.Event.EventListener(onFileLoaded));


        assert.ok(sounds[0].id === "projectId_sound" && sounds[1].id === "projectId_sound2", "Ids set correctly");
        assert.ok((sounds[0].src === soundSrc && sounds[1].src === soundSrc2), "Src set correctly");
        assert.ok(sounds[0].data === soundManager2.maxInstancesOfSameSound && sounds[1].data === soundManager2.maxInstancesOfSameSound, "Data set to defined value.");

    };


    createjs.Sound.addEventListener("event", "handler");
    createjs.Sound.setVolume(0.1);
    createjs.Sound.on("fileload", soundjsLoaded, null, true);
    createjs.Sound.registerSound("_resources/sound/sound.mp3");

});
