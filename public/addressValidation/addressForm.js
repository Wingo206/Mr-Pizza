const ids = ["regionCode", "addressLine1", "addressLine2", "locality",
    "administrativeArea", "postalCode", "verify", "validationResult",
    "runValidation", "runConfirm"];
const fieldIds = ["regionCode", "addressLine1", "addressLine2", "locality", "administrativeArea", "postalCode"];
const requiredIds = ["addressLine1"];

/**
 * divId: id of div to put the address form into
 * onConfirmation: function that takes inputs: 
 * formattedAddress: result from address validation
 * location: json with latitude, longitude
 */
window.addAddressForm = async (divId, onConfirmation) => {
    console.log("Adding address form to div " + divId);
    let resp = await fetch('/addressValidation/addressForm.html', {
        method: 'GET'
    })
    let form = await resp.text();
    // substitute the divids in to make them unique
    for (let i = 0; i < ids.length; i++) {
        form = form.replaceAll(ids[i], divId + ids[i]);
    }
    let result;

    window[divId + "runValidation"] = async () => {
        console.log("Validating form: " + divId);
        // reset the form display
        for (let i = 0; i < fieldIds.length; i++) {
            let element = document.getElementById(divId + fieldIds[i]);
            element.parentElement.classList.remove("warning");
            element.parentElement.getElementsByTagName("legend")[0].classList.remove("warning");
        }
        document.getElementById(divId + "verify").classList.add("hidden");

        // get the values from the fields
        let missing = [];
        let body = {};
        for (let i = 0; i < fieldIds.length; i++) {
            let element = document.getElementById(divId + ids[i]);
            let val = element.value;
            if (requiredIds.includes(ids[i]) && val == "") {
                missing.push(ids[i]);
                continue;
            }
            body[ids[i]] = val;
        }
        // precheck for required fields
        if (missing.length > 0) {
            for (let i = 0; i < missing.length; i++) {
                let element = document.getElementById(divId + missing[i]);
                element.parentElement.classList.add("warning");
                element.parentElement.getElementsByTagName("legend")[0].classList.add("warning");
            }
            return;
        }
        // set up the address lines
        let addressLines = [];
        addressLines.push(body["addressLine1"]);
        delete body["addressLine1"];
        addressLines.push(body["addressLine2"]);
        delete body["addressLine2"];
        body["addressLines"] = addressLines;

        console.log("fetching from /validateAddress. body: " + JSON.stringify(body));

        // get the result
        let resp = await fetch('/validateAddress', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify(body),
        })
        result = await resp.json();
        console.log(result)
        if (resp.status != 200) {
            console.log(result);
        }

        // check the result: FIX_REQUIRED, VERIFY_REQUIRED, ACCEPTED
        if (result.validationResult == 'FIX_REQUIRED') {
            // set the warnings
            for (let i = 0; i < result.warningFields.length; i++) {
                let id = result.warningFields[i];
                let element = document.getElementById(divId + id);
                element.parentElement.classList.add("warning");
                element.parentElement.getElementsByTagName("legend")[0].classList.add("warning");
            }
        } else if (result.validationResult == 'VERIFY_REQUIRED') {
            // small thing that allows you to check that the address is correct
            document.getElementById(divId + "validationResult").innerHTML = "Is this your address? " + result.formattedAddress;
            document.getElementById(divId + "verify").classList.remove("hidden");
        } else {
            // we're good, calls onConfirmation
            onConfirmation(result.formattedAddress, result.location);
        }
    }

    window[divId + "runConfirm"] = async () => {
        if (!result) {
            return;
        }
        onConfirmation(result.formattedAddress, result.location);
    }

    document.getElementById(divId).innerHTML = form;
}
