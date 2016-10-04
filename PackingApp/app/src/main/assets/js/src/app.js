/*
XXX: Implementation steps
get the list of pos and the qty
subtract it with the qty in the batch table
subtract it with the qty in the firebase current tracking table for the restaurant
*/
// Global variable to hold the PO rendered component
// This is to hook into the printQR function
var POItemRendered, PackingFlowRendered, POPreviewRendered,renderApp;
// -----------------------------------------------------------------------------

var SuppliesDialog = React.createClass({
  getInitialState: function() {
    return {supplies: {}};
  },
  componentDidUpdate: function(prevProps, prevState) {
    $.material.init();
  },
  componentDidMount: function() {
    $("#suppliesDialog").modal({
      "backdrop": "static",
      "show": true});
  },
  updateSuppliesData: function(item_id, event) {
    var tmp = this.state.supplies;
    tmp[parseInt(item_id)] = event.target.value;
    this.setState({supplies: tmp});
  },
  sendSupplies: function() {
    $.ajax({
      type: 'POST',
      url: HQ_URL + '/outlet/supplies_status?phase=start_of_day',
      data: JSON.stringify({"supplies": this.state.supplies}),
      success: function(data) {
        console.log(data);
        // Hiding the dialog
        $("#suppliesDialog").modal("hide");
       },
      error: function(jqxhr, textStatus, error) {
        var err_msg = textStatus + ", " + jqxhr.responseText;
        console.error("Start of day signal failed: " + err_msg);
      },
      contentType: "application/json",
      dataType: 'text'
    });
  },
  render: function() {
    var rowItems = this.props.items.map(function (item) {
      return (
        <tr key={item.id}>
          <td>
          <img src={'img/' + item.image_url} style={{height: '30px'}}/>{item.name}
          </td>
          <td><input ref={item.id} type="text" onChange={this.updateSuppliesData.bind(this, item.id)}/></td>
        </tr>
      );
    }, this);
    return (
      <div id="suppliesDialog" className="modal fade" tabIndex="-1">
        <div className="modal-dialog" style={{top: '75px'}}>
          <div className="modal-content">
            <div className="modal-header">
              <h4 style={{margin: '0 auto', width: '240px'}}>Start of Day - Store Supplies</h4>
            </div>
            <div className="modal-body">
              <table className="table table-striped" style={{margin: '0 auto'}}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {rowItems}
              </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-raised btn-info" onClick={this.sendSupplies} >Confirm</button>
              <button className="btn btn-raised" data-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

// -----------------------------------------------------------------------------

var PackingApp = React.createClass({
  getInitialState: function() {
    return {poData: null, packingData: null};
  },
  immediateUIReplication: function(packedPo_id){

     for (var i=0;i<packedPo_id.length;i++)
     {
     var po_id=packedPo_id[i];
      if (this.state.poData[po_id]) {
                    this.state.poData[po_id].map(function(item) {
                        var poCopy = this.state.poData;
                        delete poCopy[po_id];
                        this.setState({poData: poCopy,
                          packingData: this.state.packingData,
                          poBorderWidth: this.state.poBorderWidth});
                    }.bind(this));
                  }
     }
    },
  syncFromServer: function() {
    $.ajax({
      url: HQ_URL + '/food_vendor/po_data/' + RESTAURANT_ID,
      dataType: 'json',
      contentType: 'application/json',
      success: function(result) {
        this.setState({poData: result.data,
          packingData: this.state.packingData,
          poBorderWidth: this.state.poBorderWidth});
        // Ensure that the new data does not override safe zone checks
        this.checkSafeZone();
      }.bind(this),
      error: function(jqxhr, textStatus, error) {
        var err_msg = textStatus + ", " + jqxhr.responseText;
        console.error("Get PO data failed: " + err_msg);
      }
    });
  },
  // setup the event handler for firebase event packing
  // {"1":[{"food_item_id":3,"total_qty":20,"packed_qty":10},{"food_item_id":2,"total_qty":15,"packed_qty":8},{"food_item_id":4,"total_qty":10,"packed_qty":0}]}
  subscribeToFirebase: function() {
    var firebaseRef = new Firebase(FIREBASE_URL + "/" +
      RESTAURANT_ID);
    firebaseRef.on("value", function(snapshot) {
      if (snapshot.val() == null) {
        return true;
      }
      this.setState({poData: this.state.poData,
        packingData: snapshot.val(),
        poBorderWidth: this.state.poBorderWidth});
    }.bind(this), function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
  },
  checkSafeZone: function() {
    console.log("Checking whether PO has crossed safe zone or not");
    var widthDict = this.state.poBorderWidth;
    for (var po_id in this.state.poData) {
      var sdt_db = this.state.poData[po_id][0]["scheduled_delivery_time"];
      var scheduled_delivery_time = new Date(sdt_db);
      var safe_zone_start_interval = SAFE_ZONE_START * 60 * 60 * 1000;
      var safe_zone_start = new Date(scheduled_delivery_time.getTime() - safe_zone_start_interval);
      var safe_zone_end_interval = SAFE_ZONE_END * 60 * 60 * 1000;
      var safe_zone_end = new Date(scheduled_delivery_time.getTime() + safe_zone_end_interval);

      var now = Date.now();
      // Checking if it is before the safe zone start time, then removing the PO from the list
      if (now < safe_zone_start.getTime()) {
        var poCopy = this.state.poData;
        delete poCopy[po_id];
        this.setState({poData: poCopy,
          packingData: this.state.packingData,
          poBorderWidth: this.state.poBorderWidth});
      }

      // sending sms if it is past safe zone start
      if (now > safe_zone_start.getTime()) {
        var friendlyPOName = this.state.poData[po_id][0]["vendor_name"] +
          '-' + this.state.poData[po_id][0]["outlet_name"] +
          '-' + (po_id).toString(36).toUpperCase();
        var mobile_num = this.state.poData[po_id][0]["phone_no"];
        // Sending sms alert for a po only once
        if (simpleStorage.get("safe_zone:" + friendlyPOName) === undefined) {
        Android.sendSMS(mobile_num, "Safe zone of PO- " + friendlyPOName +
              " has begun. Please starting packing the PO.");
        simpleStorage.set("safe_zone:" + friendlyPOName, true);
        }
      }
      // Checking if it is past the last pack time, then removing the PO from the list
      if (now > safe_zone_end.getTime()) {
        var poCopy = this.state.poData;
        delete poCopy[po_id];
        this.setState({poData: poCopy,
          packingData: this.state.packingData,
          poBorderWidth: this.state.poBorderWidth});
      }

     //check PO is in Shared Preference
              if (this.state.poData[po_id])
              {
                  this.state.poData[po_id].map(function (item)
                  {
                      var dataFromSP = Android.GetPODataFromSP(false);
                      if (dataFromSP != undefined && dataFromSP != "undefined")
                      {
                          var parsedData = JSON.parse(dataFromSP);
                          var restaurantData=parsedData[RESTAURANT_ID];
                          if(restaurantData!=undefined && restaurantData!="undefined")
                          {
                          var poId=po_id;
                          var poDataFromSP =_.findWhere(parsedData[RESTAURANT_ID].poConfirmed[0].confirmedPOData.data,
                                                        { "po_id" :poId});
                          if (poDataFromSP != undefined)
                          {
                              if (poDataFromSP.packed_qty > 0)
                              {
                                  var poCopy = this.state.poData;
                                  delete poCopy[po_id];
                                  this.setState({ poData: poCopy,
                                      packingData: this.state.packingData,
                                      poBorderWidth: this.state.poBorderWidth
                                  });
                              }
                          }
                          }
                      }
                  } .bind(this));
              }
      // Check if this po is already packed
      if (this.state.poData[po_id]) {
        this.state.poData[po_id].map(function(item) {
          if (item.packed_qty > 0) {
            var poCopy = this.state.poData;
            delete poCopy[po_id];
            this.setState({poData: poCopy,
              packingData: this.state.packingData,
              poBorderWidth: this.state.poBorderWidth});
          }
        }.bind(this));
      }
    }
  },
  checkStartOfDay: function() {
    if (this.state.poData == null) {
      return;
    }
    if (Object.keys(this.state.poData).length == 0) {
      return;
    }
    var start_of_day = this.state.poData[Object.keys(this.state.poData)[0]][0].start_of_day;
    var now = new Date();
    var toCompare = new Date();
    toCompare.setHours(parseInt(start_of_day.split(':')[0]));
    toCompare.setMinutes(parseInt(start_of_day.split(':')[1]));
    toCompare.setSeconds(parseInt(start_of_day.split(':')[2]));
    // Do not call for supplies unless its not time
    if (toCompare.getTime() < now.getTime()) {
      return;
    }
    $.ajax({
      url: HQ_URL + '/food_vendor/supply_list/' + RESTAURANT_ID,
      dataType: 'json',
      contentType: 'application/json',
      success: function(result) {
        // If the supplies is already logged, then return
        if (result.length == 0) {
          return false;
        }
        React.render(<SuppliesDialog
            items={result} />,
          document.getElementById('suppliesContainer'));
      }.bind(this),
      error: function(jqxhr, textStatus, error) {
        var err_msg = textStatus + ", " + jqxhr.responseText;
        console.error("Get supplies data failed: " + err_msg);
      }
    });
  },
  componentDidMount: function() {
    this.subscribeToFirebase();
    this.syncFromServer();
    this.checkStartOfDay();
    setInterval(this.syncFromServer, 30000);
    setInterval(this.checkSafeZone, 30000);
    setInterval(this.checkStartOfDay, 300000);
  },
  render: function() {
    var headerStyle = {
      margin: '0 auto',
      width: '300px'
    };
    var containerDivStyle = {
      overflow: 'auto'
    };
    return (
      <div>
        <h1 style={headerStyle}>Atchayam Pack</h1>
        <div style={containerDivStyle}>
          <POListView
            poData={React.addons.createFragment(this.state.poData)}
            packingData={React.addons.createFragment(this.state.packingData)}
          />
        </div>
        <TransporterButton
          poData={React.addons.createFragment(this.state.poData)}
         />
      </div>
    );
  }
});

// -----------------------------------------------------------------------------
 renderApp=React.render(
  <PackingApp />,
  document.getElementById('main')
);

// -- Supplementary functions --------------------------------------------------
function testPacking(num, po_id, item_id) {
  var firebaseRef = new Firebase(FIREBASE_URL + "/" +
      RESTAURANT_ID + "/" +
      po_id + "/" +
      item_id);
  firebaseRef.child("barcodes").remove();
}

function initiateBluetooth() {
  Android.connectToPrinter();
}

function printLabel() {
  Android.printLabel();
}

function barcodePrinted(barcode,datamatrixcode, error, source) {
  console.log("Barcode has been printed");
  if (error) {
    $("#sealing_complete_btn").prop("disabled", false);
    alert(barcode);
    return;
  }
  PackingFlowRendered.barcodePrinted(barcode,datamatrixcode, source);
}

function sealingComplete() {
  console.log("Sealing is complete");
  if (PackingFlowRendered == undefined) {
    alert("Please select a PO");
    return;
  }
  if($("#packingScreen").css("display") != "block") {
    alert("Please select a PO");
    return;
  }
  PackingFlowRendered.sealingComplete();
}

function initializeArduino() {
  console.log("Connecting to arduino from webapp");
  Android.initializeArduino();
}

function changeInternetStatus(status) {
  if (status == 'online') {
    $("#internet-status").removeClass("offline");
    $("#internet-status").addClass("online");
     var dataFromSP = Android.GetPODataFromSP(false);
       if (dataFromSP != undefined && dataFromSP != "undefined")
           {
           var jsonData=JSON.parse(dataFromSP);
           var confirmedDataValue=[];
           var poConfirmedValue=jsonData[RESTAURANT_ID].poConfirmed;
           _.each(poConfirmedValue,function(z,x){
                 //   console.log(z);
                   confirmedDataValue.push(z.confirmedPOData);
               });
               var encodedValue=window.btoa(JSON.stringify(confirmedDataValue));
               //console.log(encodedValue);
       $.ajax({
              type: 'POST',
              url: HQ_URL + '/food_vendor/new_batches',
              data: {"batch":encodedValue},
              dataType: 'text',
              crossDomain: true,
              success: function (data)
              {
                  console.log(data);
                  Android.RemoveKeyPairValue(false);
              }.bind(this),
              error: function (jqxhr, textStatus, error)
              {
                  var err_msg = textStatus + ", " + jqxhr.responseText;
                  console.error("Creating new batch failed: " + err_msg);
              },
          });
         }

  } else {
    $("#internet-status").removeClass("online");
    $("#internet-status").addClass("offline");
  }
}

function sendMail() {
  var subject = "ALERT: Picked up qty is more than Packed qty";
  var body = "Restaurant ID - " + "\n" +
          "Outlet ID- " + "\n" +
          "Friendly PO Name- ";
  Android.sendMailToHQ(SENDER_EMAIL, subject, body);
}
