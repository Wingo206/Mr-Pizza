const { runQuery, employeePool } = require("../util/database_util");
const { handleWorksAt, handleAuth, authRoles } = require("../authApi.js");
const { queryStoreLatlng } = require("./assignmentApi");
const { getJSONBody } = require("../util/inputValidationUtil.js");
const { googleMapsApiKey } = require("../util/config");
const superagent = require('superagent');

/**
 * Handles a POST request with a JSON body containing:
 * regionCode, locality, administrativeArea, postalCode, addressLines
 * Uses Google Maps Address Validation API with Usps Cass support enabled
 * 
 * checks result.verdict.addressComplete, result.verdict.hasUnconfirmedComponents
 * checks result.address.missingComponentTypes, result.address.unconfirmedComponentTypes
 * 
 * can return:
 * formattedAddress: result.address.formattedAddress
 * location: result.geocode.location
 * 
 * addressComplete: true or false
 * hasUnconfirmedComponents: true or false
 * addressComplete, unconfirmedComponents
 * false => redo the missing and unconfirmed components
 * true, false => best result, good
 * true, true => you should check,
 */
async function validateAddress(req, res) {

    // read inputs from the request body
    let decodedData = await getJSONBody(req, res, ['regionCode', 'locality', 'administrativeArea', 'postalCode', 'addressLines']);
    if (!decodedData) {
        return;
    }

    // regioncode = country, locality = city, administrativeArea = state, postalCode = zip code, addressLines = address street
    let requestBody = {
        'address': {
            'regionCode': decodedData.regionCode,
            'locality': decodedData.locality,
            'administrativeArea': decodedData.administrativeArea,
            'postalCode': decodedData.postalCode,
            'addressLines': decodedData.addressLines
        },
        'enableUspsCass': true
    }
    console.log("Request body: " + JSON.stringify(requestBody) + "\n");
    let validation;
    try {
        validation = await new Promise((resolve, reject) => {
            superagent
                .post(`https://addressvalidation.googleapis.com/v1:validateAddress?key=${googleMapsApiKey}`)
                .send(requestBody)
                .end((err, res) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    resolve(res.body);
                })
        })
    } catch {
        res.writeHead(400, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({ error: "Bad address validation request." }));
        return;
    }

    console.log("Response body: " + JSON.stringify(validation));
    let verdict = validation.result.verdict;
    let address = validation.result.address;
    let geocode = validation.result.geocode;

    // Check the response to see if it was good, and pick out the important parts
    // check if address complete. If not, then you need to fix it.
    if (!verdict.addressComplete) {
        // address is not complete, figure out which components are bad
        let problemComponents = [];
        let warningFields = [];
        if (address.missingComponentTypes) {
            address.missingComponentTypes.forEach(c => problemComponents.push(c));
        }
        if (address.unconfirmedComponentTypes) {
            address.unconfirmedComponentTypes.forEach(c => problemComponents.push(c));
        }
        if (problemComponents.includes("locality")) {
            warningFields.push("locality");
            problemComponents.splice(problemComponents.indexOf("locality"), 1);
        }
        if (problemComponents.includes("postal_code")) {
            warningFields.push("postalCode");
            problemComponents.splice(problemComponents.indexOf("postal_code"), 1);
        }
        // anything else, it's a problem with the address line 1
        if (problemComponents.length > 0) {
            warningFields.push("addressLine1");
        }

        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({
            validationResult: "FIX_REQUIRED",
            warningFields: warningFields,
        }));
        return;
    }
    if (verdict.hasInferredComponents || verdict.hasReplacedComponents) {
        // Prompt a verification that this is the correct address
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify({
            validationResult: "VERIFY_REQUIRED",
            formattedAddress: address.formattedAddress,
            location: geocode.location,
        }));
        return;
    }
    // Accepted address

    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end(JSON.stringify({
        validationResult: "ACCEPTED",
        formattedAddress: address.formattedAddress,
        location: geocode.location,
    }));
}

module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/validateAddress',
            handler: validateAddress
        }
    ]
}