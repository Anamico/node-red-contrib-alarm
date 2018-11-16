'use strict';

const async = require('async');

module.exports = function(RED) {

    var stateSenders = [];

    function AnamicoAlarmPanel(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.sensor = function(callback) {
            callback(true);
        };

        this.registerStateSender = function(callback) {
            stateSenders.push(callback);
        };

        this.setState = function(payload) {
            async.parallel(stateSenders, function(stateSender, callback) {
                stateSender(payload);
                callback(null);
            });
        };
    }
    RED.nodes.registerType("AnamicoAlarmPanel", AnamicoAlarmPanel);
};

// // only do something if we have been fed a new security state
// node.log(JSON.stringify(msg,null,2));
//
// if (!msg.payload) {
//     node.log("invalid payload");
//     return;
// }
//
// var localState = global.get('SecuritySystemCurrentState') || 0;
// let localAlarmType = global.get('SecuritySystemAlarmType') || 0;
//
// if (msg.payload.start) {
//     node.log("startup");
//     msg = {
//         payload: {
//             //SecuritySystemTargetState: global.SecuritySystemCurrentState,
//             SecuritySystemCurrentState: localState,
//             SecuritySystemAlarmType: localAlarmType
//         }
//     };
//     node.log(JSON.stringify(msg,null,2));
//     return [ msg, msg ];
// }
//
// let modes = ["Home", "Away", "Night", "Off","Alarm"];
//
// let targetState = msg.payload.SecuritySystemTargetState;
// let currentState = msg.payload.SecuritySystemCurrentState;
// let newState = currentState !== undefined ? currentState : targetState;
// var newAlarmType = msg.payload.SecuritySystemAlarmType;
// let alarmType = newAlarmType !== undefined ? newAlarmType : localAlarmType;
//
// // look for alarms
// if (msg.payload.zone) {
//     if (msg.payload.modes.indexOf(localState) < 0) {
//         node.log('no alarm');
//         return
//     }
//     node.log("Alarm: ");
//     newState = 4;
//     alarmType = 1;
// }
//
// node.log("newState: " + newState + ' = ' + targetState + ' || ' + currentState);
// node.log("localState: " + localState);
// node.log("alarmType: " + alarmType + ' = ' + newAlarmType + ' || ' + localAlarmType);
//
// if ((newState === undefined) && (newAlarmType === undefined)) {
//     node.log("invalid payload");
//     return;
// }
//
// // Has anything changed?
// if ((newState !== undefined ? newState : localState) !== 4 ) {
//     alarmType = 0
// }
// let alarmChanged = (localAlarmType != alarmType);
// let changed = (localState === undefined) || (localState != newState) || (localAlarmType === undefined)|| alarmChanged;
// if (!changed) {
//     node.log("no change");
//     return;
// }
//
// // persist the new state
// localState = newState !== undefined ? newState : localState;
// localAlarmType = alarmType;
// global.set('SecuritySystemCurrentState', localState);
// global.set('SecuritySystemAlarmType', localAlarmType);
//
// let isAlarm = localState === 4;
// node.status({
//     fill: isAlarm ? "red" : "green",
//     shape:"dot",
//     text:"state: " + modes[localState]
// });
//
// let fromHomekit = msg.hap && msg.hap.context && (targetState !== undefined);
// delete msg.hap;
//
// msg.payload = {
//     //SecuritySystemTargetState: global.SecuritySystemCurrentState,
//     SecuritySystemCurrentState: localState
// };
//
// if (alarmChanged) {
//     msg.payload.SecuritySystemAlarmType = localAlarmType;
// }
//
// if (fromHomekit) {
//     node.log("from homekit");
//     node.log(JSON.stringify(msg,null,2));
//     return [ msg, msg ];
// }
//
// node.log("local");
// node.log(JSON.stringify(msg,null,2));
// return [ msg ];
