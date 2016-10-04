RESTAURANT_ID_original = 1;
var value = simpleStorage.get("RESTAURANT_ID");
if(!value){
    simpleStorage.set("RESTAURANT_ID", RESTAURANT_ID_original);
    RESTAURANT_ID = RESTAURANT_ID_original;
} else {
  RESTAURANT_ID = value;
}

HQ_URL_original = "http://103.21.76.186:9090";//"http://103.21.76.186:9090";
var value = simpleStorage.get("HQ_URL");
if(!value){
    simpleStorage.set("HQ_URL", HQ_URL_original);
    HQ_URL = HQ_URL_original;
} else {
  HQ_URL = value;
}

SCANNER_URL_original = "http://103.21.76.186:9090";//"http://103.21.76.186:9090";
var value = simpleStorage.get("SCANNER_URL");
if(!value){
    simpleStorage.set("SCANNER_URL", SCANNER_URL_original);
    SCANNER_URL = SCANNER_URL_original;
} else {
  SCANNER_URL = value;
}

CURRENT_PRINT_COUNT_original = 0;
var value = simpleStorage.get("CURRENT_PRINT_COUNT");
if(!value){
    simpleStorage.set("CURRENT_PRINT_COUNT", CURRENT_PRINT_COUNT_original);
    CURRENT_PRINT_COUNT = CURRENT_PRINT_COUNT_original;
} else {
  CURRENT_PRINT_COUNT = value;
}

SAFE_ZONE_START_original = 2.5;
var value = simpleStorage.get("SAFE_ZONE_START");
if(!value){
    simpleStorage.set("SAFE_ZONE_START", SAFE_ZONE_START_original);
    SAFE_ZONE_START = SAFE_ZONE_START_original;
} else {
  SAFE_ZONE_START = value;
}

SAFE_ZONE_END_original = 0.5;
var value = simpleStorage.get("SAFE_ZONE_END");
if(!value){
    simpleStorage.set("SAFE_ZONE_END", SAFE_ZONE_END_original);
    SAFE_ZONE_END = SAFE_ZONE_END_original;
} else {
  SAFE_ZONE_END = value;
}

SHOW_SEALING_COMPLETE_original = "false";
var value = simpleStorage.get("SHOW_SEALING_COMPLETE");
if(!value){
    simpleStorage.set("SHOW_SEALING_COMPLETE", SHOW_SEALING_COMPLETE_original);
    SHOW_SEALING_COMPLETE = SHOW_SEALING_COMPLETE_original;
} else {
  SHOW_SEALING_COMPLETE = value;
}

FIREBASE_URL=simpleStorage.get("FIREBASE_URL");
console.log("Firebase url is - ", FIREBASE_URL);
PRINTER_IP='';
SENDER_EMAIL='';
TEST_TEMPLATE='';
MAX_PRINT_COUNT=-1;
PRINT_THRESHOLD=3;
// Variables to hold the last time
HH=null;
MM=null;

// get the other details from the HQ
$.ajax({
  url: HQ_URL + '/food_vendor/config/' + RESTAURANT_ID,
  success: function(data) {
    data = JSON.parse(data);
    console.log("Received details from HQ- " + data);
    FIREBASE_URL=data.firebase_url;
    simpleStorage.set("FIREBASE_URL", FIREBASE_URL);
    PRINTER_IP=data.printer_ip;
    SENDER_EMAIL=data.sender_email;
    MAX_PRINT_COUNT=data.max_print_count;
    TEST_TEMPLATE=data.test_template;

    // Making the test call to arduino
    Android.sendTestToRpi(PRINTER_IP);
   },
  error: function(jqxhr, textStatus, error) {
    var err_msg = textStatus + ", " + jqxhr.responseText;
    console.error("Failed to get restaurant config: " + err_msg);
  },
  contentType: "application/json",
  dataType: 'text'
});


