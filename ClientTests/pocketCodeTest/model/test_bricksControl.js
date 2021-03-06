/// <reference path="../../qunit/qunit-1.23.0.js" />
/// <reference path="../../../Client/pocketCode/scripts/components/broadcastManager.js" />
/// <reference path="../../../Client/pocketCode/scripts/components/gameEngine.js" />
/// <reference path="../../../Client/pocketCode/scripts/components/sprite.js" />
/// <reference path="../../../Client/pocketCode/scripts/model/bricksCore.js" />
/// <reference path="../../../Client/pocketCode/scripts/model/bricksControl.js" />
/// <reference path="../../../Client/pocketCode/scripts/components/formula.js" />
'use strict';

QUnit.module("model/bricksControl.js");


QUnit.test("WhenProgramStartBrick", function (assert) {

    //assert.expect(11);   //init async asserts (to wait for)
    var done1 = assert.async();

    var program = new PocketCode.GameEngine();
    program._collisionManager = new PocketCode.CollisionManager(400, 200);  //make sure collisionMrg is initialized before calling an onStart event

    program._background = new PocketCode.Model.Sprite(program, { id: "spriteId", name: "spriteName" });  //to avoid error on start
    program.projectReady = true;

    var b = new PocketCode.Model.WhenProgramStartBrick("device", "sprite", { x: 1, y: 2 }, program.onProgramStart);
    b.dispose();
    assert.equal(b._disposed, true, "disposed");
    
    b = new PocketCode.Model.WhenProgramStartBrick("device", "sprite", { x: 1, y: 2 }, program.onProgramStart);
    assert.ok(b._device === "device" && b._sprite === "sprite", "brick created and properties set correctly");
    assert.ok(b instanceof PocketCode.Model.WhenProgramStartBrick && b instanceof PocketCode.Model.ScriptBlock, "instance check");
    assert.ok(b.objClassName === "WhenProgramStartBrick", "objClassName check");

    //test empty container
    var handlerCalled = 0;
    var handler = function () {
        handlerCalled++;
    };

    program.onProgramStart.addEventListener(new SmartJs.Event.EventListener(handler, this));
    //simulate project loaded for tests
    program._resourcesLoaded = true;
    program._spritesLoaded = true;

    program.runProject();
    assert.ok(handlerCalled === 1, "executed handler called (once)");

    //add a brick container
    var bricks = [];
    var TestBrick2 = (function () {
        TestBrick2.extends(PocketCode.Model.ThreadedBrick, false);

        function TestBrick2(device, sprite) {
            PocketCode.Model.ThreadedBrick.call(this, device, sprite);
            this.executed = 0;
        }

        TestBrick2.prototype.merge({
            _execute: function (id) {
                this.executed++;
                var _self = this;
                window.setTimeout(function () { _self._return(id, false) }, 100);
                //this._return(id, false);    //LOOP DELAY = FALSE
            },
        });

        return TestBrick2;
    })();

    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));

    b.bricks = new PocketCode.Model.BrickContainer(bricks);    //container including bricks

    b.onExecuted.removeEventListener(new SmartJs.Event.EventListener(handler, this));

    var asyncHandler = function () {
        assert.ok(true, "onExecuted called: including threaded bricks");
        done1();
    };
    b.onExecuted.addEventListener(new SmartJs.Event.EventListener(asyncHandler, this));
    //stop so that program can be started again
    program.stopProject();

    program.runProject();

});


QUnit.test("WhenActionBrick", function (assert) {

    var done1 = assert.async();

    var program = new PocketCode.GameEngine();
    var sprite = new PocketCode.Model.Sprite(program, { id: "spriteId", name: "spriteName" });
    var b = new PocketCode.Model.WhenActionBrick("device", sprite, { x: 1, y: 2, action: "action" }, program.onSpriteTabbedAction);

    b.dispose();
    assert.equal(b._disposed, true, "dispose called");

    b = new PocketCode.Model.WhenActionBrick("device", sprite, { x: 1, y: 2, action: "action" }, program.onSpriteTabbedAction);
    assert.ok(b._device === "device" && b._sprite === sprite && b._action === "action", "brick created and properties set correctly");
    assert.ok(b instanceof PocketCode.Model.WhenActionBrick && b instanceof PocketCode.Model.ScriptBlock, "instance check");
    assert.ok(b.objClassName === "WhenActionBrick", "objClassName check");

    //test empty container
    var handlerCalled = 0;
    var handler = function () {
        handlerCalled++;
    };

    b.onExecuted.addEventListener(new SmartJs.Event.EventListener(handler, this));
    program._onSpriteTabbedAction.dispatchEvent({ sprite: sprite });
    assert.equal(handlerCalled, 1, "executed handler called (once)");

    //add a brick container
    var bricks = [];
    var TestBrick2 = (function () {
        TestBrick2.extends(PocketCode.Model.ThreadedBrick, false);

        function TestBrick2(device, sprite) {
            PocketCode.Model.ThreadedBrick.call(this, device, sprite);
            this.executed = 0;
        }

        TestBrick2.prototype.merge({
            _execute: function (id) {
                this.executed++;
                //var _self = this;
                window.setTimeout(function () { this._return(id, false) }.bind(this), 100);
                //this._return(id, false);    //LOOP DELAY = FALSE
            },
        });

        return TestBrick2;
    })();

    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));

    b.bricks = new PocketCode.Model.BrickContainer(bricks);    //container including bricks

    b.onExecuted.removeEventListener(new SmartJs.Event.EventListener(handler, this));

    var asyncHandler = function () {
        assert.ok(true, "onExecuted called: including threaded bricks");
        done1();
    };
    b.onExecuted.addEventListener(new SmartJs.Event.EventListener(asyncHandler, this));
    program._onSpriteTabbedAction.dispatchEvent({ sprite: sprite });

});


QUnit.test("WaitBrick", function (assert) {

    //assert.expect(10);   //init async asserts (to wait for)
    var done1 = assert.async();
    var done2 = assert.async();
    var done3 = assert.async();

    var device = "device";
    var program = new PocketCode.GameEngine();
    var sprite = new PocketCode.Model.Sprite(program, { id: "spriteId", name: "spriteName" });
    var duration = JSON.parse('{"type":"NUMBER","value":"0.5","right":null,"left":null}');
    var b = new PocketCode.Model.WaitBrick(device, sprite, { duration: duration });

    assert.ok(b._device === device && b._sprite === sprite && b._duration instanceof PocketCode.Formula, "brick created and properties set correctly");  // && b._duration === "duration" -> duration is parsed as formula 
    assert.ok(b instanceof PocketCode.Model.WaitBrick, "instance check");
    assert.ok(b.objClassName === "WaitBrick", "objClassName check");

    //alert(b._duration.calculate);
    assert.equal(b._duration.calculate(), 0.5, "formula created correctly");

    var asyncHandler1 = function (e) {
        assert.equal(e.loopDelay, false, "loop delay event arg");
        assert.equal(e.id, "waitPlease", "loop delay id");
        done1();

        test2();
    };
    var l1 = new SmartJs.Event.EventListener(asyncHandler1, this);
    b.execute(l1, "waitPlease");

    //multiple calls
    var s1, s2, s3, s4;
    var asyncHandler2 = function (e) {

        switch (e.id) {
            case "s1":
                s1 = new Date();
                break;
            case "s2":
                s2 = new Date();
                break;
            case "s3":
                s3 = new Date();
                break;
            case "s4":
                s4 = new Date();
                break;
        }

        if (s1 != undefined && s2 != undefined && s3 != undefined && s4 != undefined) {
            s1 = new Date() - s1;
            s2 = new Date() - s2;
            s3 = new Date() - s3;
            s4 = new Date() - s4;

            assert.ok(s1 < s2 && s2 < s3 && s3 < s4, "testing threaded calls");
            done2();

        }
    };

    l1 = new SmartJs.Event.EventListener(asyncHandler2, this);

    var test2 = function () {
        b.execute(l1, "s1");
        b._duration = new PocketCode.Formula(device, sprite, JSON.parse('{"type":"NUMBER","value":"0.4","right":null,"left":null}'));
        b.execute(l1, "s2");
        b._duration = new PocketCode.Formula(device, sprite, JSON.parse('{"type":"NUMBER","value":"0.3","right":null,"left":null}'));
        b.execute(l1, "s3");
        b._duration = new PocketCode.Formula(device, sprite, JSON.parse('{"type":"NUMBER","value":"0.2","right":null,"left":null}'));
        b.execute(l1, "s4");

        //test pause
        b.pause();
        var po = b._pendingOps;
        var set = true;
        for (var o in po) {
            set = set && po[o].timer._paused;
        }
        assert.ok(set, "all timers paused");

        b.resume();
        var set = false;
        for (var o in po) {
            set = set || po[o].timer._paused;
        }
        assert.ok(!set, "all timers resumed");

    };

    //var count = 0;
    var b2 = new PocketCode.Model.WaitBrick(device, sprite, { duration: duration });
    var asyncHandler3 = function (e) {
        //count++;
        b2.stop();

        assert.ok(false, "brick NOT stopped");
        done3();    //this will throw an error if called more than once
    };

    var l2 = new SmartJs.Event.EventListener(asyncHandler3, this);

    b2._duration = new PocketCode.Formula(device, sprite, JSON.parse('{"type":"NUMBER","value":"0.05","right":null,"left":null}'));
    b2.execute(l2, "s1");
    b2._duration = new PocketCode.Formula(device, sprite, JSON.parse('{"type":"NUMBER","value":"0.045","right":null,"left":null}'));
    b2.execute(l2, "s2");
    b2._duration = new PocketCode.Formula(device, sprite, JSON.parse('{"type":"NUMBER","value":"0.043","right":null,"left":null}'));
    b2.execute(l2, "s3");
    //b2._duration = new PocketCode.Formula(device, sprite, JSON.parse('{"type":"NUMBER","value":"100","right":null,"left":null}'));
    //b2.execute(l1, "s4");
    b2.stop();

    var timeoutId = undefined;
    var po = b2._pendingOps;
    for (var o in po) {
        timeoutId = timeoutId || po[o].timer._timeoutId;
    }

    assert.ok(timeoutId === undefined, "all timers stopped");
    //assert.ok(true, "brick stopped");
    done3();    //this will throw an error if called more than once

});


//currently not supported by android
//QUnit.test("ResetTimerBrick", function (assert) {

//    assert.ok(false, "TODO: add tests for ResetTimerBrick as soon as this brick is supported");
//});


QUnit.test("WhenBroadcastReceiveBrick", function (assert) {

    var done1 = assert.async();
    var done2 = assert.async();

    var broadcastMgr = new PocketCode.BroadcastManager([{ id: "s12", name: "test" }]);
    var b = new PocketCode.Model.WhenBroadcastReceiveBrick("device", "sprite", broadcastMgr, { receiveMsgId: "s12" });

    assert.ok(b._device === "device" && b._sprite === "sprite", "brick created and properties set correctly");
    assert.ok(b instanceof PocketCode.Model.WhenBroadcastReceiveBrick && b instanceof PocketCode.Model.ScriptBlock, "instance check");
    assert.ok(b.objClassName === "WhenBroadcastReceiveBrick", "objClassName check");

    //test empty container
    var handlerCalled = 0;
    var handler = function () {
        handlerCalled++;
    };

    b.onExecuted.addEventListener(new SmartJs.Event.EventListener(handler, this));
    broadcastMgr.publish("s12");
    assert.ok(handlerCalled === 1, "executed handler called (once)");

    //add a brick container
    var bricks = [];
    var TestBrick2 = (function () {
        TestBrick2.extends(PocketCode.Model.ThreadedBrick, false);

        function TestBrick2(device, sprite) {
            PocketCode.Model.ThreadedBrick.call(this, device, sprite);
            this.executed = 0;
        }

        TestBrick2.prototype.merge({
            _execute: function (id) {
                this.executed++;
                var _self = this;
                window.setTimeout(function () { _self._return(id, true) }, 100);
                //this._return(id, false);    //LOOP DELAY = TRUE
            },
        });

        return TestBrick2;
    })();

    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));

    b.bricks = new PocketCode.Model.BrickContainer(bricks);    //container including bricks

    b.onExecuted.removeEventListener(new SmartJs.Event.EventListener(handler, this));

    var asyncHandler = function () {
        assert.ok(true, "onExecuted called: including threaded bricks");
        done1();
    };
    b.onExecuted.addEventListener(new SmartJs.Event.EventListener(asyncHandler, this));
    broadcastMgr.publish("s12");

    //broadcastAndWait event handling: b.onExecuted is not dispatched the publish event arguments include the return handler
    handlerCalled = 0;
    //b.onExecuted.addEventListener(new SmartJs.Event.EventListener(asyncHandler, this));
    //^^ leaving the listener attached will give you an error on done1() called twice
    var asyncHandler2 = function (e) {
        assert.ok(true, "broadcastWait: onExecuted called: including threaded bricks");
        assert.equal(e.id, "broadcastWaitId", "broadcastWait: return id check");
        assert.equal(e.loopDelay, true, "broadcastWait: loopDelay check");

        done2();
    };
    broadcastMgr.publish("s12", new SmartJs.Event.EventListener(asyncHandler2, this), "broadcastWaitId");

});


QUnit.test("BroadcastBrick", function (assert) {

    var done1 = assert.async();

    var broadcastMgr = new PocketCode.BroadcastManager([{ id: "s12", name: "test" }]);
    var b = new PocketCode.Model.BroadcastBrick("device", "sprite", broadcastMgr, { broadcastMsgId: "s12" });

    assert.ok(b._device === "device" && b._sprite === "sprite" && b._broadcastMsgId === "s12", "brick created and properties set correctly");
    assert.ok(b instanceof PocketCode.Model.BroadcastBrick, "instance check");
    assert.ok(b.objClassName === "BroadcastBrick", "objClassName check");

    var id;
    var loopDelay;
    var h = function (e) {
        id = e.id;
        loopDelay = e.loopDelay;
    };
    var count = 0;
    var h2 = function () { //for broadcastMrg listener
        count++;
        assert.equal(count, 1, "broadcast was handled by broadcast manager");
        done1();
    };

    broadcastMgr.subscribe("s12", new SmartJs.Event.EventListener(h2, this));
    b.execute(new SmartJs.Event.EventListener(h, this), "sdf");

    assert.equal(id, "sdf", "return handler dispatched and id set correctly");
    assert.equal(loopDelay, undefined, "loop delay set correctly");
    
});


QUnit.test("BroadcastAndWaitBrick", function (assert) {

    //assert.expect(10);   //init async asserts (to wait for)
    var done1 = assert.async();

    var broadcastMgr = new PocketCode.BroadcastManager([{ id: "s12", name: "test" }]);
    var b = new PocketCode.Model.BroadcastAndWaitBrick("device", "sprite", broadcastMgr, { broadcastMsgId: "s12" });

    assert.ok(b._device === "device" && b._sprite === "sprite" && b._broadcastMsgId === "s12", "brick created and properties set correctly");
    assert.ok(b instanceof PocketCode.Model.BroadcastAndWaitBrick, "instance check");
    assert.ok(b.objClassName === "BroadcastAndWaitBrick", "objClassName check");

    var h = function (e) {  //async
        assert.equal(e.id, "sdf", "return handler dispatched and id set correctly");
        assert.equal(e.loopDelay, true, "loop delay set correctly");

        //assert.ok(broadcastMgr._pendingBW[)
        done1();
    };

    var TestBrick2 = (function () {
        TestBrick2.extends(PocketCode.Model.ThreadedBrick, false);

        function TestBrick2(device, sprite) {
            PocketCode.Model.ThreadedBrick.call(this, device, sprite);
            this.executed = 0;
            this._delay = 100;
        }

        TestBrick2.prototype.merge({
            _execute: function (id) {
                this.executed++;
                var _self = this;
                window.setTimeout(function () { _self._return(id, true) }, _self._delay);
                //this._return(id, false);    //LOOP DELAY = FALSE
            },
        });

        return TestBrick2;
    })();

    //one subscriber
    var tb1 = new TestBrick2();

    var _returnHandler = function (e) {
        tb1.execute(e.listener, e.id);
    };

    broadcastMgr.subscribe("s12", new SmartJs.Event.EventListener(_returnHandler, this));
    b.execute(new SmartJs.Event.EventListener(h, this), "sdf");

});


QUnit.test("WhenCollisionBrick", function (assert) {

    var physicsWorld = new PocketCode.PhysicsWorld("gameEngine");
    var b = new PocketCode.Model.WhenCollisionBrick("device", "sprite", physicsWorld, {});

    assert.ok(b._device === "device" && b._sprite === "sprite", "brick created and properties set correctly");  //TODO: add new properties
    assert.ok(b instanceof PocketCode.Model.WhenCollisionBrick && b instanceof PocketCode.Model.ScriptBlock, "instance check");
    assert.ok(b.objClassName === "WhenCollisionBrick", "objClassName check");

    assert.ok(false, "TODO: add tests for WhenCollisionBrick");
});


QUnit.test("NoteBrick", function (assert) {

    var b = new PocketCode.Model.NoteBrick("device", "sprite", { text: "s12" });

    assert.ok(b._device === "device" && b._sprite === "sprite" && b._text === "s12", "brick created and properties set correctly");
    assert.ok(b instanceof PocketCode.Model.NoteBrick, "instance check");
    assert.ok(b.objClassName === "NoteBrick", "objClassName check");

    var id;
    var loopDelay;
    var h = function (e) {
        id = e.id;
        loopDelay = e.loopDelay;
    };

    b.execute(new SmartJs.Event.EventListener(h, this), "sdf");

    assert.equal(id, "sdf", "return handler dispatcht and id set correctly");
    assert.equal(loopDelay, undefined, "loop delay set correctly");
});


QUnit.test("ForeverBrick", function (assert) {

    assert.expect(7);   //init async asserts (to wait for)
    var done1 = assert.async();
    var done2 = assert.async();

    var b = new PocketCode.Model.ForeverBrick("device", "sprite", 24);

    assert.ok(b._device === "device" && b._sprite === "sprite" && b._minLoopCycleTime === 24, "brick created and properties set correctly");
    assert.ok(b instanceof PocketCode.Model.ForeverBrick, "instance check");
    assert.ok(b.objClassName === "ForeverBrick", "objClassName check");

    var TestBrick2 = (function () {
        TestBrick2.extends(PocketCode.Model.ThreadedBrick, false);

        function TestBrick2(device, sprite) {
            PocketCode.Model.ThreadedBrick.call(this, device, sprite);
            this.executed = 0;
            this._delay = 100;
            this.loopDelay = false;

            this.onTestFinished = new SmartJs.Event.Event(this);
        }

        TestBrick2.prototype.merge({
            _execute: function (id) {
                this.executed++;
                if (this.executed === 5) {  //helper to terminate this loop, inlcuding 5 waits
                    this.onTestFinished.dispatchEvent();
                }
                var _self = this;
                //window.setTimeout(function () { _self._return(id, this.loopDelay) }, _self._delay);
                this._return(id, this.loopDelay);    //LOOP DELAY = FALSE
            },
            start: function () {
                this._stopped = false;
            },
            stop: function () {
                this._stopped = true;
            }
        });

        return TestBrick2;
    })();

    //test empty not possible
    //loop delay = false
    var bca = [];
    var tb = new TestBrick2("device", "sprite");

    bca.push(tb);
    var neverCalled = function () {
        return;
    };
    //without delay
    var testFinishedHandler1 = function (e) {
        b.stop();   //stop forever loop

        //async
        var finishTime = new Date();
        assert.equal(tb.executed, 5, "loop running continuously");
        var delay = finishTime - startTime;
        //console.log("running loop 5 times without loop delay = " + delay + "ms");
        assert.ok(delay >= 10 /*&& delay <= 35*/, "threading: without loop delay");
        done1();
    };

    b.bricks = new PocketCode.Model.BrickContainer(bca);
    tb.onTestFinished.addEventListener(new SmartJs.Event.EventListener(testFinishedHandler1, this));
    var startTime = new Date();
    b.execute(new SmartJs.Event.EventListener(neverCalled, this), "forever");

    //with delay
    var testFinishedHandler2 = function (e) {
        b2.stop();  //stop forever loop

        //async
        var finishTime = new Date();
        assert.equal(tb.executed, 5, "loop delay: loop running continuously");
        var delay = finishTime - startTime;
        //console.log("running loop 5 times without loop delay = " + delay + "ms");
        assert.ok(delay >= 40 /*&& delay <= 120*/, "loop delay: execution time");
        done2();
    };

    var b2 = new PocketCode.Model.ForeverBrick("device", "sprite");
    var tb2 = new TestBrick2("device", "sprite");
    tb2.loopDelay = true;
    bca = [];
    bca.push(tb2);
    b2.bricks = new PocketCode.Model.BrickContainer(bca);
    //var removed = tb.onTestFinished.removeEventListener(new SmartJs.Event.EventListener(testFinishedHandler1, this));
    //console.log("removed handler: " + removed);
    tb2.onTestFinished.addEventListener(new SmartJs.Event.EventListener(testFinishedHandler2, this));

    b2.execute(new SmartJs.Event.EventListener(neverCalled, this), "forever");

});


QUnit.test("IfThenElseBrick", function (assert) {

    //assert.expect(10);   //init async asserts (to wait for)
    var done1 = assert.async();
    var done2 = assert.async();
    var program = new PocketCode.GameEngine();
    var sprite = new PocketCode.Model.Sprite(program, { id: "spriteId", name: "spriteName" });

    var cond = JSON.parse('{"type":"OPERATOR","value":"EQUAL","right":{"type":"NUMBER","value":"1","right":null,"left":null},"left":{"type":"NUMBER","value":"1","right":null,"left":null}}');
    var b = new PocketCode.Model.IfThenElseBrick("device", sprite, { condition: cond });

    assert.ok(b._device === "device" && b._sprite instanceof PocketCode.Model.Sprite, "brick created and properties set correctly");  //condition is parsed to get a formula object
    assert.ok(b instanceof PocketCode.Model.IfThenElseBrick, "instance check");
    assert.ok(b.objClassName === "IfThenElseBrick", "objClassName check");

    assert.throws(function () { b.ifBricks = []; }, Error, "ERROR: validating if-bricks setter");
    assert.throws(function () { b.elseBricks = []; }, Error, "ERROR: validating else-bricks setter");

    //check the condition is valid: only for this test case
    assert.ok(b._condition.calculate(), "condition checked -> always true");

    //execute empty containers: if
    var handler1Called = false;
    var handler1LoopDelay = false;
    var handler1CallId = undefined;

    var handler1 = function (e) {
        handler1Called = true;
        handler1LoopDelay = handler1LoopDelay || e.loopDelay;
        handler1CallId = e.id;

    };

    b.execute(new SmartJs.Event.EventListener(handler1, this), "if");
    assert.ok(handler1Called, "if bricks: empty  executed");
    assert.equal(handler1CallId, "if", "if: return id");
    assert.equal(handler1LoopDelay, false, "if: return loopDelay");

    //execute empty containers: else
    //re-init
    handler1Called = false;
    handler1LoopDelay = false;
    handler1CallId = undefined;
    cond = JSON.parse('{"type":"OPERATOR","value":"EQUAL","right":{"type":"NUMBER","value":"1","right":null,"left":null},"left":{"type":"NUMBER","value":"2","right":null,"left":null}}');
    var program = new PocketCode.GameEngine();
    var sprite = new PocketCode.Model.Sprite(program, { id: "spriteId", name: "spriteName" });

    b._condition = new PocketCode.Formula("device", sprite, cond);
    //check the condition is valid: only for this test case
    assert.equal(b._condition.calculate(), false, "2nd condition checked -> now false");

    b.execute(new SmartJs.Event.EventListener(handler1, this), "else");
    assert.ok(handler1Called, "else bricks: empty executed");
    assert.equal(handler1CallId, "else", "else: return id");
    assert.equal(handler1LoopDelay, false, "else: return loopDelay");


    //threaded bricks
    var bricks = [];
    var TestBrick2 = (function () {
        TestBrick2.extends(PocketCode.Model.ThreadedBrick, false);

        function TestBrick2(device, sprite) {
            PocketCode.Model.ThreadedBrick.call(this, device, sprite);
            this.executed = 0;
        }

        TestBrick2.prototype.merge({
            _execute: function (id) {
                this.executed++;
                var _self = this;
                window.setTimeout(function () { _self._return(id, true) }, 100);
                //this._return(id, true);    //LOOP DELAY = FALSE
            },
            pause: function () {
                this.paused = true;
            },
            resume: function () {
                this.paused = false;
            },
            stop: function () {
                this.stopped = true;
            },
        });

        return TestBrick2;
    })();

    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));

    var asyncHandler = function (e) {
        assert.equal(e.id, "ifthenelse", "if-then-else: executed");
        assert.equal(e.loopDelay, true, "if-then-else: loop delay check");
        assert.deepEqual(b._pendingOps, {}, "pending ops cleared after onExecute");
        done1();

        //this isn't a very nice way to test it but will generate an err if stop() does not work
        b.execute(new SmartJs.Event.EventListener(asyncHandler, this), "ifthenelse");
        b.stop();
        done2();
    };


    var bc = new PocketCode.Model.BrickContainer(bricks);    //container including bricks
    b.ifBricks = bc;
    bricks = [];
    bricks.push(new TestBrick2("", ""));
    bricks.push(new TestBrick2("", ""));
    var bc2 = new PocketCode.Model.BrickContainer(bricks);
    b.elseBricks = bc2;

    assert.equal(b._ifBricks, bc, "if-bricks setter");
    assert.equal(b._elseBricks, bc2, "else-bricks setter");

    b.execute(new SmartJs.Event.EventListener(asyncHandler, this), "ifthenelse");
    b.pause();
    assert.equal(b._ifBricks._bricks[0].paused, true, "paused");
    b.resume();
    assert.equal(!b._ifBricks._bricks[1].paused, true, "resumed");

});


QUnit.test("WaitUntilBrick", function (assert) {

    var done1 = assert.async();
    var done2 = assert.async();

    var conditionFalse = JSON.parse('{"type":"OPERATOR","value":"EQUAL","right":{"type":"NUMBER","value":"1","right":null,"left":null},"left":{"type":"NUMBER","value":"2","right":null,"left":null}}');
    var program = new PocketCode.GameEngine();
    var sprite = new PocketCode.Model.Sprite(program, { id: "spriteId", name: "spriteName" });
    var b = new PocketCode.Model.WaitUntilBrick("device", sprite, { condition: conditionFalse }, 24);

    assert.ok(b._device === "device" && b._sprite instanceof PocketCode.Model.Sprite && b._delay === 24, "brick created and properties set correctly");   //timesToRepeat is parsed to get a formula object
    assert.ok(b instanceof PocketCode.Model.WaitUntilBrick && b instanceof PocketCode.Model.ThreadedBrick, "instance check");
    assert.ok(b.objClassName === "WaitUntilBrick", "objClassName check");

    //validation = false
    var dateTime;

    var testFinishedHandler1 = function (e) {   //simulating 1st thread
        assert.equal(e.id, "id_1", "thread 1: event argument: id");
        assert.equal(e.loopDelay, false, "thread 1: event argument: loopDelay");

        b._condition = conditionFalse;    //make sure both threads get executed even the condition is not met any more
        done1();
    };
    b.execute(new SmartJs.Event.EventListener(testFinishedHandler1, this), "id_1");

    var testFinishedHandler2 = function (e) {   //simulating 2nd thread
        assert.equal(e.id, "id_2", "thread 2: event argument: id");
        assert.equal(e.loopDelay, false, "thread 2: event argument: loopDelay");
        assert.ok((new Date() - dateTime) > 50, "paused and resumed");
        
        b._condition = conditionFalse;    //make sure both threads get executed even the condition is not met any more
        done2();
    };
    b.execute(new SmartJs.Event.EventListener(testFinishedHandler2, this), "id_2");

    window.setTimeout(function () {
        b.pause();
    }, 10);

    dateTime = new Date();
    window.setTimeout(function () {
        //set Condition to true: internally
        var conditionTrue = JSON.parse('{"type":"OPERATOR","value":"EQUAL","right":{"type":"NUMBER","value":"1","right":null,"left":null},"left":{"type":"NUMBER","value":"1","right":null,"left":null}}');
        var formulaTrue = new PocketCode.Formula("device", sprite, conditionTrue);

        b._condition = formulaTrue;
    }, 20);

    window.setTimeout(function () {
        b.resume();
    }, 50);

});


QUnit.test("RepeatBrick", function (assert) {

    assert.expect(9);   //init async asserts (to wait for)
    var done1 = assert.async();
    var done2 = assert.async();

    var nTimes = JSON.parse('{"type":"NUMBER","value":"6","right":null,"left":null}');
    var program = new PocketCode.GameEngine();
    var sprite = new PocketCode.Model.Sprite(program, { id: "spriteId", name: "spriteName" });
    var b = new PocketCode.Model.RepeatBrick("device", sprite, { x: 1, y: 2, timesToRepeat: nTimes }, 24);

    assert.ok(b._device === "device" && b._sprite instanceof PocketCode.Model.Sprite && b._minLoopCycleTime === 24, "brick created and properties set correctly");   //timesToRepeat is parsed to get a formula object
    assert.ok(b instanceof PocketCode.Model.RepeatBrick, "instance check");
    assert.ok(b.objClassName === "RepeatBrick", "objClassName check");

    var TestBrick2 = (function () {
        TestBrick2.extends(PocketCode.Model.ThreadedBrick, false);

        function TestBrick2(device, sprite) {
            PocketCode.Model.ThreadedBrick.call(this, device, sprite);
            this.executed = 0;
            this._delay = 10;
            this.loopDelay = false;

            //this.onTestFinished = new SmartJs.Event.Event(this);
        }

        TestBrick2.prototype.merge({
            _execute: function (id) {
                //this.executed++;
                //if (this.executed === 6) {  //helper to terminate this loop, inlcuding 5 waits
                //    this.onTestFinished.dispatchEvent();
                //    return;
                //}
                var _self = this;
                //window.setTimeout(function () { _self._return(id, true) }, _self._delay);
                this._return(id, this.loopDelay);
            },
            start: function () {
                this._stopped = false;
            },
            stop: function () {
                this._stopped = true;
            }
        });

        return TestBrick2;
    })();

    //test empty not possible
    //loop delay = false
    var bca = [];
    var tb = new TestBrick2("device", sprite);

    bca.push(tb);
    //without delay
    var testFinishedHandler1 = function (e) {
        //async
        var finishTime = new Date();
        //assert.equal(tb.executed, 6, "loop running continuously");
        var delay = finishTime - startTime;
        //console.log("running loop 6 times without loop delay (5 delays) = " + delay + "ms");
        assert.ok(delay >= 10, "threading: without loop delay");
        assert.equal(e.id, "n_times", "id returned correctly");
        assert.equal(e.loopDelay, false, "loopDelay returned correctly");

        done1();
    };

    b.bricks = new PocketCode.Model.BrickContainer(bca);
    var startTime = new Date();
    b.execute(new SmartJs.Event.EventListener(testFinishedHandler1, this), "n_times");

    //with delay
    var testFinishedHandler2 = function (e) {
        //async
        var finishTime = new Date();
        //assert.equal(tb.executed, 6, "loop running continuously");
        var delay = finishTime - startTime;
        //console.log("running loop 6 times without loop delay (5 delays) = " + delay + "ms");
        assert.ok(delay >= 50, "loop delay: threading: including loop delay");
        assert.equal(e.id, "n_times2", "loop delay: id returned correctly");
        assert.ok(!e.loopDelay, "loop delay: delay returned correctly: handles correctly but return value is always false or undefined");

        done2();
    };

    var b2 = new PocketCode.Model.RepeatBrick("device", sprite, { timesToRepeat: nTimes }, 25);
    var tb2 = new TestBrick2("device", "sprite");
    tb2.loopDelay = true;
    bca = [];
    bca.push(tb2);
    b2.bricks = new PocketCode.Model.BrickContainer(bca);
    //var removed = tb.onTestFinished.removeEventListener(new SmartJs.Event.EventListener(testFinishedHandler1, this));
    //console.log("removed handler: " + removed);
    //tb2.onTestFinished.addEventListener(new SmartJs.Event.EventListener(testFinishedHandler2, this));

    b2.execute(new SmartJs.Event.EventListener(testFinishedHandler2, this), "n_times2");

});


QUnit.test("RepeatUntilBrick", function (assert) {

    var done1 = assert.async();

    var conditionFalse = JSON.parse('{"type":"OPERATOR","value":"EQUAL","right":{"type":"NUMBER","value":"1","right":null,"left":null},"left":{"type":"NUMBER","value":"2","right":null,"left":null}}');
    var program = new PocketCode.GameEngine();
    var sprite = new PocketCode.Model.Sprite(program, { id: "spriteId", name: "spriteName" });
    var b = new PocketCode.Model.RepeatUntilBrick("device", sprite, { condition: conditionFalse }, 24);

    assert.ok(b._device === "device" && b._sprite instanceof PocketCode.Model.Sprite && b._minLoopCycleTime === 24, "brick created and properties set correctly");   //timesToRepeat is parsed to get a formula object
    assert.ok(b instanceof PocketCode.Model.RepeatUntilBrick && b instanceof PocketCode.Model.LoopBrick, "instance check");
    assert.ok(b.objClassName === "RepeatUntilBrick", "objClassName check");

    //validation = false
    var TestBrick = (function () {
        TestBrick.extends(PocketCode.Model.ThreadedBrick, false);

        function TestBrick(device, sprite) {
            PocketCode.Model.ThreadedBrick.call(this, device, sprite);
            this.executed = 0;
            this._delay = 10;
            this.loopDelay = false;
        }

        TestBrick.prototype.merge({
            _execute: function (id) {
                this.executed++;
                this._return(id, this.loopDelay);
            },
            start: function () {
                this._stopped = false;
            },
            stop: function () {
                this._stopped = true;
            }
        });

        return TestBrick;
    })();

    var testBrick1 = new TestBrick("device", sprite);
    var innerBricks = [testBrick1, new TestBrick("device", sprite)];
    b.bricks = new PocketCode.Model.BrickContainer(innerBricks);
    
    var testFinishedHandler1 = function (e) {
        assert.equal(e.id, "n_times", "event argument: id");
        assert.equal(e.loopDelay, false, "event argument: loopDelay");
        assert.ok(testBrick1.executed > 0, "inner bricks executed until condition = true");

        done1();
    };
    b.execute(new SmartJs.Event.EventListener(testFinishedHandler1, this), "n_times");

    window.setTimeout(function () {
        //set Condition to true: internally
        var conditionTrue = JSON.parse('{"type":"OPERATOR","value":"EQUAL","right":{"type":"NUMBER","value":"1","right":null,"left":null},"left":{"type":"NUMBER","value":"1","right":null,"left":null}}');
        var formulaTrue = new PocketCode.Formula("device", sprite, conditionTrue);

        b._condition = formulaTrue;
    }, 20);

});


