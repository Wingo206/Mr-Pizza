const { runQuery, employeePool } = require("../util/database_util");
const { getJSONBody } = require('../util/inputValidationUtil.js');

/**
 * api endpoint that updates the database each time the position of the order is updated
 * url: /geolocation/updatePos
 */
async function updateOrderPos(req, res, jwtBody) {
    let decodedData = await getJSONBody(req, res, ['latlng']);
    if (!decodedData) {
        return;
    }

    let latlng = decodedData.latlng;
    // checks that it is a point (i.e. geography?)

    let queryString = `update delivery_batch set current_latlng = ${latlng} where assignedToEmp = ${jwtBody.id}`;
}

module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/geolocation/updatePos',
        }
    ]
}