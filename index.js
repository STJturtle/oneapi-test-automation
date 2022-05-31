const axios = require("axios").default;
const proposalData = require("./proposal.json");

const profile = "local";
const url = profile==="local" ? "http://localhost:9098" : "https://app.skyfall.turtle-feature.com";

function createQuote() {

    axios
        .post(
            `${url}/api/minterprise/quote/v0/premiums/request`,
            {
                "businessType": "NEW",
                "productCode": "hospicash",
                "riskInsured": {
                    "sumInsured": 1000
                }
            }
        )
        .then((response) => {
            console.log((response.data[0].proposalResults[0].proposalId));
            getQuote(response.data[0].referenceId, response.data[0].quoteId);
        })
        .catch(function (error) {
            console.log(error);
        });
}

function getQuote(referenceId, quoteId) {
    axios
        .get(
            `${url}/api/minterprise/quote/v0/premiums/result?productCode=hospicash&referenceId=${referenceId}&quoteId=${quoteId}`
        )
        .then(function (response) {
            console.log(response.data);
            getProposal(response.data.referenceId, response.data._id);
        })
        .catch(function (error) {
            console.log(error);
        });
}

function getProposal(referenceId, premiumResultId) {
    console.log(referenceId, premiumResultId);
    axios
        .post(
            `${url}/api/minterprise/proposal/v0/proposal/request`,
            {
                premiumResultId: premiumResultId,
                referenceId: referenceId,
                insurerCode: "CARE",
                productCode: "hospicash",
                personalDetails: {
                    title: "Mr",
                    firstName: "John",
                    lastName: "Doe",
                    email: "sumit.jadiya@turtlemint.com",
                    mobile: "6100080400",
                    dob: "12/10/1992",
                },
                registeredAddress: {
                    city: "PUNE",
                    pincode: "411045",
                    address1: "xyz dd",
                    address2: "abc",
                    cityId: "PUNE_MAHARASHTRA",
                    state: "Maharashtra",
                },
                otherDetails: {},
            }
        )
        .then((response) => {
            console.log((response.data[0].proposalResults[0].proposalId));
            generateLink(referenceId, response.data[0].proposalResults[0].proposalId);
        })
        .catch(function (error) {
            console.log(error);
        });
}

function generateLink(referenceId, proposalId) {

    console.log(referenceId, proposalId);
    axios
        .post(
            `${url}/api/minterprise/v0/payments/link`,
            {
                "productCode": "hospicash",
                "insurerCode": "HDFC",
                "proposalId": proposalId,
                "referenceId": referenceId
            }
        )
        .then((response) => {
            console.log((response.data));
        })
        .catch(function (error) {
            console.log(error);
        });
}

createQuote();

