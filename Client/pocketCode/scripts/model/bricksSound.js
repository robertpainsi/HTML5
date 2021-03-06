﻿/// <reference path="../../../smartJs/sj.js" />
/// <reference path="../core.js" />
/// <reference path="bricksCore.js" />
/// <reference path="../components/soundManager.js" />
/// <reference path="../components/proxy.js" />
'use strict';

PocketCode.Model.merge({

    PlaySoundBrick: (function () {
        PlaySoundBrick.extends(PocketCode.Model.BaseBrick, false);

        function PlaySoundBrick(device, sprite, soundManager, propObject) {
            PocketCode.Model.BaseBrick.call(this, device, sprite);

            this._soundManager = soundManager;
            this._soundId = propObject.resourceId;
        }

        PlaySoundBrick.prototype._execute = function () {
            if (this._soundId)  //can be null
                this._soundManager.startSound(this._soundId);
            this._return();
        };

        return PlaySoundBrick;
    })(),


    PlaySoundAndWaitBrick: (function () {
        PlaySoundAndWaitBrick.extends(PocketCode.Model.ThreadedBrick, false);

        function PlaySoundAndWaitBrick(device, sprite, soundManager, propObject) {
            PocketCode.Model.ThreadedBrick.call(this, device, sprite);

            //this._soundManager = soundManager;
            //this._soundId = propObject.resourceId;
        }

        PlaySoundAndWaitBrick.prototype.merge({
            _execute: function (callId) {
                //if (this._soundId)  //can be null
                //    this._soundManager.startSound(this._soundId);
                this._return(callId);
            },
            pause: function () {
                //this._paused = true;
                //var po, pos = this._pendingOps;
                //for (var p in pos) {
                //    if (!pos.hasOwnProperty(p))
                //        continue;
                //    po = pos[p];
                //    if (po.timer)
                //        po.timer.pause();
                //    po.paused = true;
                //}
            },
            resume: function () {
                //this._paused = false;
                //var po, pos = this._pendingOps;
                //for (var p in pos) {
                //    if (!pos.hasOwnProperty(p))
                //        continue;
                //    po = pos[p];
                //    po.paused = false;
                //    if (po.timer)
                //        po.timer.resume();
                //}
            },
            stop: function () {
                //this._paused = false;
                //var po, pos = this._pendingOps;
                //for (var p in pos) {
                //    if (!pos.hasOwnProperty(p))
                //        continue;
                //    po = pos[p];
                //    if (po.timer)
                //        po.timer.stop();
                //}
                //this._pendingOps = {};
            },
        });

        return PlaySoundAndWaitBrick;
    })(),


    StopAllSoundsBrick: (function () {
        StopAllSoundsBrick.extends(PocketCode.Model.BaseBrick, false);

        function StopAllSoundsBrick(device, sprite, soundManager) {
            PocketCode.Model.BaseBrick.call(this, device, sprite);

            this._soundManager = soundManager;
        }

        StopAllSoundsBrick.prototype._execute = function () {
            this._soundManager.stopAllSounds();
            this._return();
        };

        return StopAllSoundsBrick;
    })(),


    SetVolumeBrick: (function () {
        SetVolumeBrick.extends(PocketCode.Model.BaseBrick, false);

        function SetVolumeBrick(device, sprite, soundManager, propObject) {
            PocketCode.Model.BaseBrick.call(this, device, sprite);

            this._soundManager = soundManager;
            this._percentage = new PocketCode.Formula(device, sprite, propObject.percentage);
        }

        SetVolumeBrick.prototype._execute = function () {
            var val = this._percentage.calculate();
            if (isNaN(val))
                this._return(false);
            else {
                this._soundManager.volume = val;
                this._return();
            }
        };

        return SetVolumeBrick;
    })(),


    ChangeVolumeBrick: (function () {
        ChangeVolumeBrick.extends(PocketCode.Model.BaseBrick, false);

        function ChangeVolumeBrick(device, sprite, soundManager, propObject) {
            PocketCode.Model.BaseBrick.call(this, device, sprite);

            this._soundManager = soundManager;
            this._value = new PocketCode.Formula(device, sprite, propObject.value);
        }

        ChangeVolumeBrick.prototype._execute = function () {
            var val = this._value.calculate();
            if (isNaN(val))
                this._return(false);
            else {
                this._soundManager.volume += val;   //changeVolume(this._value.calculate());
                this._return();
            }
        };

        return ChangeVolumeBrick;
    })(),


    SpeakBrick: (function () {
        SpeakBrick.extends(PocketCode.Model.BaseBrick, false);

        function SpeakBrick(device, sprite, soundManager, propObject) {
            PocketCode.Model.BaseBrick.call(this, device, sprite);

            this._soundManager = soundManager;
            this._text = new PocketCode.Formula(device, sprite, propObject.text);

            if (this._text.isStatic) {  //sound will not change at runtime and can be cached in soundManager
                this._soundId = SmartJs.getNewId();
                var text = this._text.calculate().replace(/\n,\r/g, '');
                if (text == '') {
                    this._soundId = undefined;
                    return;
                }
                //caching
                var request = new PocketCode.ServiceRequest(PocketCode.Services.TTS, SmartJs.RequestMethod.GET, { text: text });
                this._soundManager.loadSound(request.url, this._soundId, 'mp3');
            }
        }

        SpeakBrick.prototype._execute = function () {
            if (this._soundId) {
                this._soundManager.startSound(this._soundId);
            }
            else {
                var text = this._text.calculate().replace(/\n,\r/g, '');
                if (text !== '') {
                    //we use a request object here to generate an url
                    var request = new PocketCode.ServiceRequest(PocketCode.Services.TTS, SmartJs.RequestMethod.GET, { text: text });
                    this._soundManager.startSoundFromUrl(request.url);
                }
            }
            this._return();
        };

        return SpeakBrick;
    })(),


    SpeakAndWaitBrick: (function () {
        SpeakAndWaitBrick.extends(PocketCode.Model.ThreadedBrick, false);

        function SpeakAndWaitBrick(device, sprite, soundManager, propObject) {
            PocketCode.Model.ThreadedBrick.call(this, device, sprite);

            //this._soundManager = soundManager;
            //this._soundId = propObject.resourceId;
        }

        SpeakAndWaitBrick.prototype.merge({
            _execute: function (callId) {
                //if (this._soundId)  //can be null
                //    this._soundManager.startSound(this._soundId);
                this._return(callId);
            },
            pause: function () {
                //this._paused = true;
                //var po, pos = this._pendingOps;
                //for (var p in pos) {
                //    if (!pos.hasOwnProperty(p))
                //        continue;
                //    po = pos[p];
                //    if (po.timer)
                //        po.timer.pause();
                //    po.paused = true;
                //}
            },
            resume: function () {
                //this._paused = false;
                //var po, pos = this._pendingOps;
                //for (var p in pos) {
                //    if (!pos.hasOwnProperty(p))
                //        continue;
                //    po = pos[p];
                //    po.paused = false;
                //    if (po.timer)
                //        po.timer.resume();
                //}
            },
            stop: function () {
                //this._paused = false;
                //var po, pos = this._pendingOps;
                //for (var p in pos) {
                //    if (!pos.hasOwnProperty(p))
                //        continue;
                //    po = pos[p];
                //    if (po.timer)
                //        po.timer.stop();
                //}
                //this._pendingOps = {};
            },
        });

        return SpeakAndWaitBrick;
    })(),

});
