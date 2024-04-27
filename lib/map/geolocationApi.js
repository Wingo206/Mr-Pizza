const { queryStoreLatlng } = require("./assignmentApi");
const { getJSONBody } = require('../util/inputValidationUtil.js');

/**
 * api endpoint that updates the database each time the position of the order is updated
 * url: /geolocation/updatePos
 */
async function updateOrderPos() {

}

module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/geolocation/updatePos'
        }
    ]
}