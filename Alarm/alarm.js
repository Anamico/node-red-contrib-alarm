const async = require('async');

module.exports = function(RED) {

    function Alarm(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg) {

            const thing = ( msg.payload && msg.payload.thing ) || config.thing;

        });
    }
    RED.nodes.registerType("anamicoAlarmSystem", Alarm);
};
