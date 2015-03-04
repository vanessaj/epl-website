var Type;
var Url;
var Data;
var ContentType;
var DataType;
var ProcessData;
var method;

var divOpen = '<div style="margin-bottom:8px">';
var divClose = '</div>';
var boldOpen = '<span style="font-weight:bold">';
var boldClose = '</span>';

var currentRoutingLegDivOpen = '<div class="currentLeg" style="margin-bottom:12px !important">';
var nonCurrentRoutingLegDivOpen = '<div class="nonCurrentLeg" style="margin-bottom:12px !important">';
var hrefShowNonCurrent = '<a id="ShowNonCurrent" href="#" style="color:white;text-decoration:underline;" onclick="ShowOrHideNonCurrentLegs(true)">Show full routing plan</a>';
var hrefShowCurrentOnly = '<a id="ShowCurrentOnly" href="#" style="color:white;text-decoration:underline;" onclick="ShowOrHideNonCurrentLegs(false)">Show current routing leg only</a>';

//Generic function to call WCF  Service
function CallService() {
    $.ajax({
        type: Type, //GET or POST or PUT or DELETE verb
        url: Url, // Location of the service
        data: Data, //Data sent to server
        contentType: ContentType, // content type sent to server
        dataType: DataType, //Expected data format from server
        processdata: ProcessData, //True or False
        success: function (msg) {//On Successful service call
            ServiceSucceeded(msg);
        },
        error: ServiceFailed// When Service call fails
    });
}

function ServiceFailed(result) {
    $('#EPLTxtResult').html('Shipment status is not available.');
    ClearVars();
}

function GetShipmentStatus(shipmentId) {
    //Clear results box
    $('#EPLTxtResult').html("Retrieving shipment status...");

    if (shipmentId == null || shipmentId == "") {
        $('#EPLTxtResult').html('Please provide a Shipment Tracking Id.');
        return;
    }

    Type = "GET";
    Url = "http://smsweb.emergencypartslogistics.com/service/v2/shipment/status/" + shipmentId;
    DataType = "jsonp";
    ProcessData = false;
    method = "Status";
    CallService();
}

function ServiceSucceeded(result) {
    if (DataType == "jsonp") {
        if (method == "Status") {
            var shipmentObject = result.Shipment;
            if (shipmentObject == null) {
                $('#EPLTxtResult').html('Invalid Shipment Tracking Id.');
            }
            else {
                $('#EPLTxtResult').html(ParseShipment(shipmentObject));
                ShowOrHideNonCurrentLegs(false);    // Default to not showing non-current routing legs
            }
        }
    }
    ClearVars();
}

    function ParseShipment(shipment) {
        if (shipment == null) return '';

        /**** Shipment Info ****/
        var htmlString = divOpen + boldOpen + 'Shipment Job Id:' + boldClose + ' ' + shipment.Id + '<br/>' +
        boldOpen + 'Origin:' + boldClose + ' ' + shipment.Origin + '<br/>' +
            boldOpen + 'Description of Goods:' + boldClose + ' ' + shipment.DescriptionOfGoods + divClose;

        //if Notice is not null or whitespace, then print
        if (shipment.Notice != null) {
            var noticeString = $.trim(shipment.Notice);
            if (noticeString != "") {
                htmlString += divOpen + boldOpen + 'Notice:' + boldClose + ' ' + noticeString + divClose;
            }
        }
        
        /**** Clickable link for showing/hiding non-current routing legs if there are any non-current routing legs in the shipment ****/
        if (AnyNonCurrentLegs(shipment.RoutingPlan)) {
            htmlString += '<br/>' + divOpen + hrefShowNonCurrent + hrefShowCurrentOnly + divClose;    
        }

        /**** Routing Plan ****/
        htmlString += ParseRoutingPlan(shipment.RoutingPlan);

        /**** Final Destination ****/
        htmlString += boldOpen + 'Final Destination:' + boldClose + ' ' + shipment.Destination + '<br/>';

        /**** Ship To Date/Time ****/
        htmlString += boldOpen + 'ETA:' + boldClose + ' ' + shipment.ShipmentDeliveryTime + '<br/>';

        /**** Proof of Delivery ****/
        htmlString += ParseProofOfDelivery(shipment.ProofOfDelivery);

        htmlString += divClose;
        return htmlString;
    }

    function ParseRoutingPlan(routingPlan) {
        var htmlString = '';
        if (routingPlan != null) {
            if (routingPlan.RoutingLegs != null) {
                /*htmlString = divOpen + boldOpen + 'Routing Plan State:' + boldClose + ' ' + routingPlan.State + divClose;*/
                for (var i = 0; i < routingPlan.RoutingLegs.length; i++) {
                    var routingLeg = routingPlan.RoutingLegs[i];
                    htmlString += routingLeg.StatusCode == 2 ? currentRoutingLegDivOpen : nonCurrentRoutingLegDivOpen;
                    htmlString += boldOpen + routingLeg.Method + ': ' + routingLeg.RoutingLegStart + boldClose + ' to ' + boldOpen + routingLeg.RoutingLegFinish + boldClose + '<br/>';
                    if (routingLeg.RoutingLegAttributes != null) {
                        htmlString += '<table style="font-size:11pt;">';
                        htmlString += '<tr style="font-weight:bold;font-size:11pt;">';
                        htmlString += '<th style="text-align:left;font-size:11pt;">Event</th><th style="text-align:left;padding-left:13px;font-size:11pt;">Status</th><th style="text-align:left;padding-left:13px;font-size:11pt;">Date and Time (UTC)</th>';
                        htmlString += '</tr>';
                        for (var j = 0; j < routingLeg.RoutingLegAttributes.length; j++) {
                            var routingLegAttribute = routingLeg.RoutingLegAttributes[j];
                            htmlString += '<tr style="font-size:11pt;">';
                            htmlString += '<td style="font-size:11pt;">' + routingLegAttribute.Name + '</td><td style="padding-left:13px;font-size:11pt;">' + routingLegAttribute.Status + '</td><td style="padding-left:13px;font-size:11pt;">' + routingLegAttribute.CompletedDateTime + '</td>';
                            htmlString += '</tr>';
                        }
                        htmlString += '</table>';
                    }
                    htmlString += divClose;
                }
                htmlString += divClose;
            }
        }
        else {
            htmlString = divOpen + 'This shipment has not been routed.' + divClose;
        }
        return htmlString;
    }

    function ParseProofOfDelivery(proofOfDelivery) {
        var htmlString = '';

        if (proofOfDelivery != null) {
            htmlString = divOpen;
            htmlString += boldOpen + 'POD:' + boldClose + ' ' + proofOfDelivery.PodText + '</br>';
            htmlString += boldOpen + 'POD Time (UTC):' + boldClose + ' ' + proofOfDelivery.PodDateTime;
            htmlString += divClose;
        }
        return htmlString;
    }

    function ClearVars() {
        Type = null;
        Url = null;
        Data = null;
        ContentType = null;
        DataType = null;
        ProcessData = null;
        method = null;
    }
            
    function ShowOrHideNonCurrentLegs(isShow) {
        if (isShow) {
            $("#EPLTxtResult .nonCurrentLeg").show('fast');
            $("#EPLTxtResult #ShowNonCurrent").hide('fast');
            $("#EPLTxtResult #ShowCurrentOnly").show('fast');
        } else {
            $("#EPLTxtResult .nonCurrentLeg").hide('fast');
            $("#EPLTxtResult #ShowCurrentOnly").hide('fast');
            $("#EPLTxtResult #ShowNonCurrent").show('fast');
        }
        return '';
    }

    function AnyNonCurrentLegs(routingPlan) {
        if (routingPlan != null) {
            if (routingPlan.RoutingLegs != null) {
                for (var i = 0; i < routingPlan.RoutingLegs.length; i++) {
                    if (routingPlan.RoutingLegs[i].StatusCode != 2) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Read a page's GET URL variables and return them as an associative array.
    function getUrlVars() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');    
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);        
            vars[hash[0]] = hash[1];
        }    return vars;
    }
    
    