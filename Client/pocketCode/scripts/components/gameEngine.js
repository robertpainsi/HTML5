﻿/// <reference path="../../../smartJs/sj.js" />
/// <reference path="../../../smartJs/sj-ui.js" />
/// <reference path="../../../smartJs/sj-event.js" />
/// <reference path="../core.js" />
/// <reference path="userVariableHost.js" />
/// <reference path="sprite.js" />
/// <reference path="imageStore.js" />
/// <reference path="../model/userVariable.js" />
/// <reference path="../components/broadcastManager.js" />
/// <reference path="../components/soundManager.js" />
'use strict';

PocketCode.GameEngine = (function () {
    GameEngine.extends(PocketCode.UserVariableHost, false);

    function GameEngine(minLoopCycleTime) {
        PocketCode.UserVariableHost.call(this, PocketCode.UserVariableScope.GLOBAL);

        this._executionState = PocketCode.ExecutionState.INITIALIZED;
        this._minLoopCycleTime = minLoopCycleTime || 20; //ms
        this._resourcesLoaded = false;
        this._resourceLoadedSize = 0;
        this._spritesLoaded = false;
        this._spritesLoadingProgress = 0;

        this._id = "";
        this.title = "";
        this.description = "";
        this.author = "";
        this._originalScreenHeight = 0;
        this._originalScreenWidth = 0;

        //this._background = undefined;
        this._sprites = [];
        this._originalSpriteOrder = []; //neede to reinit layers on stop/restart

        this.resourceBaseUrl = "";

        this._imageStore = new PocketCode.ImageStore();
        this._imageStore.onLoadingProgress.addEventListener(new SmartJs.Event.EventListener(this._resourceProgressChangeHandler, this));
        this._imageStore.onLoadingError.addEventListener(new SmartJs.Event.EventListener(this._resourceLoadingErrorHandler, this));
        this._imageStore.onLoad.addEventListener(new SmartJs.Event.EventListener(this._imageStoreLoadHandler, this));
        this.__sounds = {};

        this._soundManager = new PocketCode.SoundManager();
        this._soundManager.onLoadingProgress.addEventListener(new SmartJs.Event.EventListener(this._resourceProgressChangeHandler, this));
        this._soundManager.onLoadingError.addEventListener(new SmartJs.Event.EventListener(this._resourceLoadingErrorHandler, this));
        this._soundManager.onLoad.addEventListener(new SmartJs.Event.EventListener(this._soundManagerLoadHandler, this));
        this._soundManager.onFinishedPlaying.addEventListener(new SmartJs.Event.EventListener(this._spriteOnExecutedHandler, this));    //check if project has finished executing
        this._loadingAlerts = {
            invalidSoundFiles: [],
            unsupportedBricks: [],
            deviceUnsupportedFeatures: [],
            deviceEmulation: false,
            deviceLockRequired: false,
        };

        this._broadcasts = [];
        this._broadcastMgr = new PocketCode.BroadcastManager(this._broadcasts);

        //events
        this._onLoadingProgress = new SmartJs.Event.Event(this);
        this._onLoadingError = new SmartJs.Event.Event(this);
        this._onLoad = new SmartJs.Event.Event(this);

        this._onBeforeProgramStart = new SmartJs.Event.Event(this);
        this._onProgramStart = new SmartJs.Event.Event(this);
        this._onProgramExecuted = new SmartJs.Event.Event(this);
        this._onSpriteUiChange = new SmartJs.Event.Event(this);
        this._onVariableUiChange = new SmartJs.Event.Event(this);
        //map the base class (global variable host) to our public event
        this._onVariableChange.addEventListener(new SmartJs.Event.EventListener(function (e) { this._onVariableUiChange.dispatchEvent({ id: e.id, properties: e.properties }, e.target); }, this));

        this._onTabbedAction = new SmartJs.Event.Event(this);
    }

    //properties
    Object.defineProperties(GameEngine.prototype, {
        //rendering
        spritesAsPropertyList: {
            get: function () {
                var prop,
                    props = this._background ? [this._background.renderingProperties] : [],
                    sprites = this._sprites;

                for (var i = 0, l = sprites.length; i < l; i++)
                    props.push(sprites[i].renderingProperties);
                //adjust positions including viewport width/height: 
                //for (var i = 0, l = props.length; i < l; i++) {
                //    prop = props[i];
                //    prop.x += this._originalScreenWidth / 2.0;
                //    prop.y = this._originalScreenHeight / 2.0 - prop.y;
                //}
                return props;
            },
        },
        //project execution
        executionState: {
            get: function () {
                return this._executionState;
            },
        },
        projectLoaded: {
            get: function () {
                return this._resourcesLoaded && this._spritesLoaded;
            },
        },
        projectScreenSize: {
            get: function () {
                return { width: this._originalScreenWidth, height: this._originalScreenHeight };
            },
        },
        muted: {
            set: function (value) {
                //if (typeof value !== 'boolean')
                //    throw new Error('invalid parameter: muted');
                this._soundManager.muted = value;
            },
        },
        //background: {     //currently not in use- we're keeping them anyway for data binding
        //    get: function () {
        //        return this._background;
        //    },
        //},
        //sprites: {
        //    get: function() {
        //        return this._sprites;
        //    },
        //},
        _sounds: {
            set: function (sounds) {
                if (!(sounds instanceof Array))
                    throw new Error('setter expects type Array');

                for (var i = 0, l = sounds.length; i < l; i++)
                    this.__sounds[sounds[i].id] = sounds[i];

                this._soundManager.loadSounds(this._resourceBaseUrl, sounds);
            },
        },
        broadcasts: {
            set: function (broadcasts) {
                if (!(broadcasts instanceof Array))
                    throw new Error('setter expects type Array');

                this._broadcasts = broadcasts;
                this._broadcastMgr.init(broadcasts);
            },
        }
    });

    //events
    Object.defineProperties(GameEngine.prototype, {
        onLoadingProgress: {
            get: function () { return this._onLoadingProgress; },
        },
        onLoad: {
            get: function () { return this._onLoad; },
        },
        onLoadingError: {
            get: function () { return this._onLoadingError; },
        },
        onBeforeProgramStart: {
            get: function () { return this._onBeforeProgramStart; },
        },
        onProgramStart: {
            get: function () { return this._onProgramStart; },
        },
        onProgramExecuted: {
            get: function () { return this._onProgramExecuted; },
        },
        onSpriteUiChange: {
            get: function () { return this._onSpriteUiChange; },
        },
        onVariableUiChange: {
            get: function () { return this._onVariableUiChange; },
        },
        onTabbedAction: {
            get: function () { return this._onTabbedAction; },
        },
    });

    //methods
    GameEngine.prototype.merge({
        getVariablesAsPropertyList: function () {
            var obj = this.renderingVariables;  //global
            if (this._background)
                obj = obj.concat(this._background.renderingVariables);
            var sprites = this._sprites;
            for (var i = 0, l = sprites.length; i < l; i++)
                obj = obj.concat(sprites[i].renderingVariables);
            return obj;
        },
        reloadProject: function () {
            if (!this._jsonProject)
                throw new Error('no project loaded');
            
            this.loadProject(this._jsonProject);
        },
        loadProject: function (jsonProject) {
            if (this._disposing || this._disposed)
                return;
            if (this._executionState !== PocketCode.ExecutionState.STOPPED)
                this.stopProject();
            if (!jsonProject)
                throw new Error('invalid argument: json project');
            else
                this._jsonProject = jsonProject;

            this._spritesLoaded = false;
            this._resourcesLoaded = false;
            this._loadingAlerts = {
                invalidSoundFiles: [],
                unsupportedBricks: [],
                deviceUnsupportedFeatures: [],
                deviceEmulation: false,
                deviceLockRequired: false,
            };

            this._id = jsonProject.id;
            var header = jsonProject.header;
            this.title = header.title;
            this.description = header.description;
            this.author = header.author;
            this._originalScreenHeight = header.device.screenHeight;
            this._originalScreenWidth = header.device.screenWidth;

            //create objects
            if (this._background)
                this._background.dispose();// = undefined;
            this._sprites.dispose();
            this._originalSpriteOrder = [];

            //resource sizes
            this._resourceTotalSize = 0;
            this._resourceLoadedSize = 0;
            for (i = 0, l = jsonProject.images.length; i < l; i++) {
                this._resourceTotalSize += jsonProject.images[i].size;
            }
            for (i = 0, l = jsonProject.sounds.length; i < l; i++) {
                this._resourceTotalSize += jsonProject.sounds[i].size;
            }

            this._onLoadingProgress.dispatchEvent({ progress: 0 });
            if (this._resourceTotalSize === 0)
                this._resourcesLoaded = true;
            else {
                this._resourceBaseUrl = jsonProject.resourceBaseUrl;
                this._imageStore.loadImages(this._resourceBaseUrl, jsonProject.images);
                //sounds are loaded after images using the image stores onLoad event
            }

            this._broadcasts = jsonProject.broadcasts || [];
            this._broadcastMgr = new PocketCode.BroadcastManager(this._broadcasts);

            //make sure vars and lists are defined before creating bricks and sprites
            this._variables = jsonProject.variables || [];
            this._lists = jsonProject.lists || [];

            this._device = SmartJs.Device.isMobile ? new PocketCode.Device(this._soundManager) : new PocketCode.DeviceEmulator(this._soundManager);
            this._device.onSpaceKeyDown.addEventListener(new SmartJs.Event.EventListener(this._deviceOnSpaceKeyDownHandler, this));

            this._spritesLoadingProgress = 0;
            var bricksCount = jsonProject.header.bricksCount;
            this._spriteFactory = new PocketCode.SpriteFactory(this._device, this, this._broadcastMgr, this._soundManager, bricksCount, this._minLoopCycleTime);
            this._spriteFactory.onProgressChange.addEventListener(new SmartJs.Event.EventListener(this._spriteFactoryOnProgressChangeHandler, this));
            this._spriteFactory.onUnsupportedBricksFound.addEventListener(new SmartJs.Event.EventListener(this._spriteFactoryUnsupportedBricksHandler, this));

            if (bricksCount == 0) {
                this._spriteFactoryOnProgressChangeHandler({ progress: 100 });
                return;
            }
            //else
            if (jsonProject.background) {
                this._background = this._spriteFactory.create(jsonProject.background);
                this._background.onExecuted.addEventListener(new SmartJs.Event.EventListener(this._spriteOnExecutedHandler, this));
            }
            var sp = jsonProject.sprites;
            var sprite, i, l;
            for (i = 0, l = sp.length; i < l; i++) {
                sprite = this._spriteFactory.create(sp[i]);
                sprite.onExecuted.addEventListener(new SmartJs.Event.EventListener(this._spriteOnExecutedHandler, this));
                this._sprites.push(sprite);
                this._originalSpriteOrder.push(sprite);
            }
        },
        //loading handler
        _spriteFactoryOnProgressChangeHandler: function (e) {
            if (e.progress === 100) {
                this._spritesLoaded = true;
                this._spriteFactory.onProgressChange.removeEventListener(new SmartJs.Event.EventListener(this._spriteFactoryOnProgressChangeHandler, this));
                if (this._resourcesLoaded) {
                    //window.setTimeout(function () { this._onLoad.dispatchEvent(); }.bind(this), 100);    //update UI before
                    this._initSprites();
                    this._handleLoadingComplete();
                }
            }
            else {
                this._spritesLoadingProgress = e.progress;
                var resourceProgress = Math.round(this._resourceLoadedSize / this._resourceTotalSize * 1000) / 10;
                this._onLoadingProgress.dispatchEvent({ progress: Math.min(resourceProgress, this._spritesLoadingProgress) });
            }
        },
        _spriteFactoryUnsupportedBricksHandler: function (e) {
            this._loadingAlerts.unsupportedBricks = e.unsupportedBricks;
            //this._onLoadingAlert.dispatchEvent({ bricks: e.unsupportedBricks });
        },
        _initSprites: function () {
            // init sprites after all looks were loaded (important for look offsets)
            var bg = this._background,
                sprites = this._sprites;

            if (bg) {
                bg.initLooks();
                bg.init();
            }
            for (var i = 0, l = sprites.length; i < l; i++) {
                sprites[i].initLooks();
                sprites[i].init();
            }
        },
        _resourceProgressChangeHandler: function (e) {
            if (!e.file || !e.file.size)
                return;

            var size = e.file.size;
            this._resourceLoadedSize += size;
            var progress = Math.round(this._resourceLoadedSize / this._resourceTotalSize * 1000) / 10;
            this._onLoadingProgress.dispatchEvent({ progress: Math.min(progress, this._spritesLoadingProgress) });
        },
        _imageStoreLoadHandler: function (e) {
            this._sounds = this._jsonProject.sounds || [];
        },
        _soundManagerLoadHandler: function (e) {
            if (this._resourceLoadedSize !== this._resourceTotalSize)
                return; //load may trigger during loading single (cached) dynamic sound files (e.g. tts)
            this._resourcesLoaded = true;
            if (this._spritesLoaded) {
                //window.setTimeout(function () { this._onLoad.dispatchEvent(); }.bind(this), 100);    //update UI before
                this._initSprites();
                this._handleLoadingComplete();
            }
        },
        _handleLoadingComplete: function () {
            var loadingAlerts = this._loadingAlerts;
            var device = this._device;

            loadingAlerts.deviceUnsupportedFeatures = device.unsupportedFeatures;
            loadingAlerts.deviceEmulation = device.emulationInUse;
            loadingAlerts.deviceLockRequired = device.mobileLockRequired;

            if (loadingAlerts.deviceEmulation || loadingAlerts.deviceLockRequired || loadingAlerts.invalidSoundFiles.length != 0 ||
                loadingAlerts.unsupportedBricks.length != 0 || loadingAlerts.deviceUnsupportedFeatures.length != 0) {
                this._onLoadingProgress.dispatchEvent({ progress: 100 });   //update ui progress
                this._onLoad.dispatchEvent({ loadingAlerts: loadingAlerts });  //dispatch warnings
            }
            else
                this._onLoad.dispatchEvent();
        },
        _resourceLoadingErrorHandler: function (e) {
            if (e.target === this._soundManager)
                this._loadingAlerts.invalidSoundFiles.push(e.file);
            else
                this._onLoadingError.dispatchEvent({ files: [e.file] });
        },

        _deviceOnSpaceKeyDownHandler: function (e) {
            this._onTabbedAction.dispatchEvent({ sprite: this._background });
        },
        //project interaction
        runProject: function (reinitSprites) {
            if (this._executionState === PocketCode.ExecutionState.RUNNING)
                return;
            if (!this.projectLoaded) {
                throw new Error('no project loaded');
            }
            if (this._executionState === PocketCode.ExecutionState.PAUSED)
                return this.resumeProject();

            //if reinit: all sprites properties have to be set to their default values: default true
            if (reinitSprites !== false && this._executionState !== PocketCode.ExecutionState.INITIALIZED) {
                var bg = this._background;
                if (bg) {
                    bg.init();
                    this._onSpriteUiChange.dispatchEvent({ id: bg.id, properties: bg.renderingProperties }, bg);
                }

                this._sprites = this._originalSpriteOrder;  //reset sprite order
                var sprites = this._sprites,
                    sprite;
                for (var i = 0, l = sprites.length; i < l; i++) {
                    sprite = sprites[i];
                    sprite.init();
                    this._onSpriteUiChange.dispatchEvent({ id: sprite.id, properties: sprite.renderingProperties }, sprite);
                }

                this._resetVariables();  //global
            }
            this._executionState = PocketCode.ExecutionState.RUNNING;
            this._onBeforeProgramStart.dispatchEvent();  //indicates the project was loaded and rendering objects can be generated
            this.onProgramStart.dispatchEvent();    //notifies the listerners (script bricks) to start executing
            if (!bg)
                this._spriteOnExecutedHandler();    //make sure an empty program terminates
        },
        restartProject: function (reinitSprites) {
            this.stopProject();
            window.setTimeout(this.runProject.bind(this, reinitSprites), 100);   //some time needed to update callstack (running methods), as this method is called on a system (=click) event
        },
        pauseProject: function () {
            if (this._executionState !== PocketCode.ExecutionState.RUNNING)
                return false;

            this._soundManager.pauseSounds();
            if (this._background)
                this._background.pauseScripts();

            var sprites = this._sprites;
            for (var i = 0, l = sprites.length; i < l; i++) {
                sprites[i].pauseScripts();
            }
            this._executionState = PocketCode.ExecutionState.PAUSED;
            return true;
        },
        resumeProject: function () {
            if (this._executionState !== PocketCode.ExecutionState.PAUSED)
                return;

            this._soundManager.resumeSounds();
            if (this._background)
                this._background.resumeScripts();

            var sprites = this._sprites;
            for (var i = 0, l = sprites.length; i < l; i++) {
                sprites[i].resumeScripts();
            }
            this._executionState = PocketCode.ExecutionState.RUNNING;
        },
        stopProject: function () {
            if (this._executionState === PocketCode.ExecutionState.STOPPED)
                return;
            this._broadcastMgr.stop();
            this._soundManager.stopAllSounds();
            if (this._background) {
                this._background.stopScripts();
            }
            var sprites = this._sprites;
            for (var i = 0, l = sprites.length; i < l; i++) {
                sprites[i].stopScripts();
            }

            this._executionState = PocketCode.ExecutionState.STOPPED;
        },

        _spriteOnExecutedHandler: function (e) {
            window.setTimeout(function () {
                if (this._disposed || this._executionState === PocketCode.ExecutionState.STOPPED)   //do not trigger event more than once 
                    return;
                if (this._onTabbedAction.listenersAttached)
                    return; //still waiting for user interaction

                if (this._soundManager.isPlaying)
                    return;
                if (this._background && this._background.scriptsRunning)
                    return;
                var sprites = this._sprites;
                for (var i = 0, l = sprites.length; i < l; i++) {
                    if (sprites[i].scriptsRunning)
                        return;
                }

                this._executionState = PocketCode.ExecutionState.STOPPED;
                this._onProgramExecuted.dispatchEvent();    //check if project has been executed successfully: this will never happen if there is an endlessLoop or whenTapped brick 
            }.bind(this), 100);  //delay neede to allow other scripts to start
        },

        //brick-sprite interaction
        getSpriteById: function (spriteId) {
            var sprites = this._sprites;
            for (var i = 0, l = sprites.length; i < l; i++) {
                if (sprites[i].id === spriteId)
                    return sprites[i];
            }

            if (spriteId == this._background.id)
                return this._background;

            throw new Error('unknown sprite with id: ' + spriteId);
        },
        getSpriteLayer: function (sprite) { //including background (used in formulas)
            if (sprite === this._background)
                return 0;
            var idx = this._sprites.indexOf(sprite);
            if (idx < 0)
                throw new Error('sprite not found: getSpriteLayer');
            return idx + 1;
        },
        getLookImage: function (id) {
            //used by the sprite to access an image during look init
            return this._imageStore.getImage(id);
        },
        setSpriteLayerBack: function (sprite, layers) {
            var sprites = this._sprites;
            var idx = sprites.indexOf(sprite);
            if (idx == 0)
                return false;
            var count = sprites.remove(sprite);
            if (count == 0)
                return false;

            idx = Math.max(idx - layers, 0);
            sprites.insert(idx, sprite);

            this._onSpriteUiChange.dispatchEvent({ id: sprite.id, properties: { layer: idx + 1 } }, sprite);
            return true;
        },

        setSpriteLayerToFront: function (sprite) {
            var sprites = this._sprites;
            if (sprites.indexOf(sprite) === sprites.length - 1)
                return false;
            var count = sprites.remove(sprite);
            if (count == 0)
                return false;
            sprites.push(sprite);

            this._onSpriteUiChange.dispatchEvent({ id: sprite.id, properties: { layer: sprites.length } }, sprite);
            return true;
        },
        handleSpriteTap: function (id) {
            var sprite = this.getSpriteById(id);
            if (sprite)
                this._onTabbedAction.dispatchEvent({ sprite: sprite });

        },

        /* override */
        dispose: function () {
            if (this._disposed)
                return; //may occur when dispose on error

            this.stopProject();

            if (this._device)
                this._device.onSpaceKeyDown.removeEventListener(new SmartJs.Event.EventListener(this._deviceOnSpaceKeyDownHandler, this));

            this._imageStore.onLoadingProgress.removeEventListener(new SmartJs.Event.EventListener(this._resourceProgressChangeHandler, this));
            this._imageStore.onLoadingError.removeEventListener(new SmartJs.Event.EventListener(this._resourceLoadingErrorHandler, this));
            this._imageStore.abortLoading();
            //this._imageStore.dispose();

            this._soundManager.onLoadingProgress.removeEventListener(new SmartJs.Event.EventListener(this._resourceProgressChangeHandler, this));
            this._soundManager.onLoadingError.removeEventListener(new SmartJs.Event.EventListener(this._resourceLoadingErrorHandler, this));
            this._soundManager.onFinishedPlaying.removeEventListener(new SmartJs.Event.EventListener(this._spriteOnExecutedHandler, this));
            //this._soundManager.stopAllSounds();   //already stopped in stopProject()
            //this._soundManager.dispose();

            if (this._background)
                this._background.onExecuted.removeEventListener(new SmartJs.Event.EventListener(this._spriteOnExecutedHandler, this));

            delete this._originalSpriteOrder;
            var sprites = this._sprites;
            for (var i = 0, l = sprites.length; i < l; i++) {
                sprites[i].onExecuted.removeEventListener(new SmartJs.Event.EventListener(this._spriteOnExecutedHandler, this));
            }
            //call super
            PocketCode.UserVariableHost.prototype.dispose.call(this);
        },
    });

    return GameEngine;
})();