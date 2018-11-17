'use strict';

const async = require('async');

module.exports = function(RED) {

    var stateListeners = {};

    function AnamicoAlarmPanel(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.alarmModes = [ 'Home', 'Away', 'Night', 'Off', 'Alarm' ];

        // these nodes are in alarm state
        this.alarmNodes = new Set();

        this.alarmState = node.context().global.get('SecuritySystemCurrentState') || 0;
        this.alarmType = node.context().global.get('SecuritySystemAlarmType') || 0;
        this.isAlarm = node.alarmState === 4;

        this.setAlarmState = function(alarmState) {
            node.alarmState = alarmState;
            node.isAlarm = alarmState === 4;
            node.context().global.set('SecuritySystemCurrentState', alarmState);
        };

        this.setAlarmType = function(alarmType) {
            this.alarmType = alarmType;
            node.context().global.set('SecuritySystemAlarmType', alarmType);
        };

        /**
         * Conditionally trigger an alarm
         *
         * todo: persist alarm state and zone/etc with handle to node so we can update alarm state on panel mode changes
         *
         * @param msg
         * @param callback
         */
        this.sensor = function(msg, callback) {
            if (!msg.payload || msg.payload.zone) {
                node.error("missing payload.zone", msg);
                callback(false);
                return false;
            }
            if (!msg.payload || msg.payload.modes) {
                node.error("missing payload.modes", msg);
                callback(false);
                return false;
            }
            node.log('1');
            node.log(msg.payload.modes);
            node.log(msg.payload.modes.indexOf(node.alarmState));
            if (msg.payload.modes.indexOf(node.alarmState) < 0) {
                callback(false);
                return;
            }
            node.setState(msg);
            callback(true); // alarm triggered
        };

        this.registerStateListener = function(node, callback) {
            stateListeners[node.id] = callback;

            // also emit current state on registration (after delay of 100 msec?):
            setTimeout(function() {
                const alarmState = node.context().global.get('SecuritySystemCurrentState') || 0;
                const alarmType = node.context().global.get('SecuritySystemAlarmType') || 0;
                const isAlarm = alarmState === 4;
                // node.log(alarmState);
                // node.log(alarmType);
                // node.log(isAlarm);
                callback({
                    payload: {
                        //SecuritySystemTargetState: localState,
                        SecuritySystemCurrentState: alarmState,
                        alarmState: [ 'Home', 'Away', 'Night', 'Off', 'Alarm' ][alarmState],
                        SecuritySystemAlarmType: alarmType,
                        isAlarm: node.isAlarm
                    }
                });
            }, 100);
        };

        this.deregisterStateListener = function(node) {
            node.log('deregister: ' + node.id);
            delete stateListeners[node.id];
        };

        this.notifyChange = function (msg, fromHomekit) {
            if (fromHomekit) {
                node.log("from homekit");
                msg.payload.fromHomekit = true;
            } else {
                node.log("local");
            }
            node.log(JSON.stringify(msg,null,2));
            node.log(JSON.stringify(stateListeners,null,2));

            async.each(stateListeners, function(listener, callback) {
                listener(msg);
                callback(null);
            });
        };

        this.setState = function(msg, callback) {

            // only do something if we have been fed a new security state
            node.log('setState');
            node.log(JSON.stringify(msg,null,2));

            if (!msg.payload) {
                node.error('invalid payload', msg);
                callback({
                    error: true,
                    label: "invalid payload"
                });
                return;
            }

            const targetState = msg.payload.SecuritySystemTargetState;
            const currentState = msg.payload.SecuritySystemCurrentState;
            var newState = currentState !== undefined ? currentState : targetState;
            var newAlarmType = msg.payload.SecuritySystemAlarmType;
            var alarmType = newAlarmType !== undefined ? newAlarmType : node.alarmType;

// look for alarms
            if (msg.payload.zone) {
                if (msg.payload.modes.indexOf(node.alarmState) < 0) {
                    node.log('no alarm');
                    callback({
                        error: true,
                        label: "no alarm"
                    });
                    return
                }
                node.log('Alarm: ');
                newState = 4;
                alarmType = 1;
            }

            node.log('newState: ' + newState + ' = ' + targetState + ' || ' + currentState);
            node.log('localState: ' + node.alarmState);
            node.log('alarmType: ' + alarmType + ' = ' + newAlarmType + ' || ' + node.alarmType);

            if ((newState === undefined) && (newAlarmType === undefined)) {
                node.error('invalid payload', msg);
                callback({
                    error: true,
                    label: "invalid payload"
                });
                return;
            }

// Has anything changed?
            if ((newState !== undefined ? newState : node.alarmState) !== 4 ) {
                alarmType = 0
            }
            const alarmChanged = (node.alarmType != alarmType);
            const changed = (node.alarmState === undefined) || (node.alarmState != newState) || (node.alarmType === undefined)|| alarmChanged;
            if (!changed) {
                node.log('no change');
                callback({
                    label: node.alarmModes[node.alarmState]
                });
                return;
            }

// persist the new state
            node.setAlarmState(newState !== undefined ? newState : node.alarmState);
            node.setAlarmType(alarmType);

            msg.payload = {
                //SecuritySystemTargetState: global.SecuritySystemCurrentState,
                SecuritySystemCurrentState: node.alarmState,
                alarmState: node.alarmModes[node.alarmState]
            };
            msg.payload.isAlarm = node.isAlarm;

            if (alarmChanged) {
                msg.payload.SecuritySystemAlarmType = node.alarmType;
            }

            const fromHomekit = msg.hap && msg.hap.context && (targetState !== undefined);
            delete msg.hap;

            node.notifyChange(msg, fromHomekit);
            callback({
                label: node.alarmModes[node.alarmState]
            });
        };
    }
    RED.nodes.registerType("AnamicoAlarmPanel", AnamicoAlarmPanel);
};


