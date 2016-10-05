// This is the transporter dialog page
var TransporterButton = React.createClass({
  openTransporterDialog: function() {
  $(".cssload-container").show();
    $("#transporterContainer").empty();
    React.render(<TransporterDialog
      poData={this.props.poData} />,
    document.getElementById('transporterContainer'));
  },
  render: function() {
    var btnStyle = {
      margin: '0 auto',
      display: 'block',
      width: '200px'
    };
    return (
      <div>
      <a href="javascript:void(0)" style={btnStyle} className="btn btn-success" onClick={this.openTransporterDialog}>Transporter Pickup</a>
      </div>
    );
  }
});

var TransporterDialog = React.createClass({
  getInitialState: function() {
    // uistate is for showing the UI [outlets, po_id, packed_qty]
    return {uiState: [], allOutlets: [], poQtyMap: {}, signaturePad: null};
  },
  componentDidUpdate: function(prevProps, prevState) {
    $.material.init();
  },
  // A utility function to return the type of an object
  toType: function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
  },
  componentDidMount: function() {
    signaturePad = new SignaturePad(document.querySelector("#transporterDialog canvas"));
    var firebaseRef = new Firebase(FIREBASE_URL + "/" + RESTAURANT_ID);
    firebaseRef.once("value", function(snapshot) {
      var snapValue = snapshot.val();
      if (snapValue == null) {
        return true;
      }
      var barcodeRefValue = Android.GetPODataFromSP(true);
        if (barcodeRefValue != undefined)
        {
            var parsedData = JSON.parse(barcodeRefValue);
            var poQtyMapFromLocal = {};
            var bcodes = [];
            var pid;
            _.each(parsedData, function (i, j)
            {
                _.each(i.pos, function (q, w)
                {
                bcodes=[];
                    _.each(q.items, function (e, r)
                    {
                      _.each(e.barcodes, function(m,n)
                      {
                        pid = q.po_id;
                        var barcode_datamatrix={"barcode":m.barcode,"data_matrix":m.data_matrix};
                        bcodes.push.call(bcodes,barcode_datamatrix);
                      });
                    });
                     poQtyMapFromLocal[pid] = { "totalCount": bcodes.length, "barcodes": bcodes };
                });
            });
        }
      //{"2":[null,{"packed":5},null,{"packed":9},{"packed":2}]}
      var poQtyMap = {};
      // Populating the po-qty map
      for (var po_id in snapValue) {
        var totalCount = 0;
        var totalBarcodes = [];
        if (this.toType(snapValue[po_id]) == 'array') {
          for (var i = 0; i < snapValue[po_id].length; i++) {
            var currentItem = snapValue[po_id][i];
            if (currentItem == null) {
              continue;
            }
            totalCount += Object.keys(currentItem["barcodes"]).length;
            var barcodes = Object.keys(currentItem["barcodes"]).map(
                    function(item){ return currentItem["barcodes"][item] }
                    );
            totalBarcodes = totalBarcodes.concat(barcodes);
          }
        } else if (this.toType(snapValue[po_id]) == 'object') {
          for (var item in snapValue[po_id]) {
            if (snapValue[po_id][item]["barcodes"] == undefined) {
              continue;
            }
            totalCount += Object.keys(snapValue[po_id][item]["barcodes"]).length;
            var barcodes = Object.keys(snapValue[po_id][item]["barcodes"]).map(
                    function(key){ return snapValue[po_id][item]["barcodes"][key] }
                    );
            totalBarcodes = totalBarcodes.concat(barcodes);
          }
        }
        poQtyMap[po_id] = {"totalCount": totalCount, "barcodes": totalBarcodes};
      }
      // populating the unused outlets
      var allOutlets = [];
      var outlets = ['--'];
      for (var po_id in poQtyMapFromLocal) {
        if (!this.props.poData.hasOwnProperty(po_id)) {
          continue;
        }
        var outlet_id =po_id;// this.props.poData[po_id][0]["outlet_id"];
        var outlet_name = this.props.poData[po_id][0]["outlet_name"];
        allOutlets.push({outlet_id: outlet_id,
            po_id: po_id,
            outlet_name: outlet_name,
            used: false});
        outlets.push({outlet_id: outlet_id, outlet_name: outlet_name});
      }
      // calculating the UI State
      var uiState = [];
      uiState.push({outlets: outlets,
          selectedOutletId: '--',
          po_id: '--',
          packed_qty: null,
          barcodes: null,
          err_msg: ''});
      // Setting the state
      this.setState({uiState: uiState,
            allOutlets: allOutlets,
            poQtyMapFromLocal: poQtyMapFromLocal,
            signaturePad: signaturePad});
      $("#transporterDialog").modal("show");
       $('#transporterDialog').on('shown.bs.modal', function (e) {
              $(".cssload-container").hide();
            })
    }.bind(this), function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
    // add the signature screen
    // the submit button creates and batch and sends the data to HQ
  },
  addRow: function() {
    // get the list of unused outlets and append to the div
    console.log("add row clicked");
    var remainingOutlets = ['--'];
    for (var i = 0; i < this.state.allOutlets.length; i++) {
      if (!this.state.allOutlets[i]["used"]) {
        remainingOutlets.push({outlet_id: this.state.allOutlets[i]["outlet_id"],
          outlet_name: this.state.allOutlets[i]["outlet_name"]});
      }
    }
    var uiState = this.state.uiState;
    uiState.push({outlets: remainingOutlets,
          selectedOutletId: '--',
          po_id: '--',
          packed_qty: null,
          barcodes: null,
          error_msg: ''});
    this.setState({
      uiState: uiState,
      allOutlets: this.state.allOutlets,
      poQtyMapFromLocal: this.state.poQtyMapFromLocal,
      signaturePad: this.state.signaturePad
    });
  },
  confirmPacking: function() {
    // Disabling the submit button for some time
    $("#packToHQ").prop('disabled', true);
    setTimeout(function(){
      $("#packToHQ").prop('disabled', false);
    }, 3000);
    var internetState=$('#internet-status').attr('class');
        if(internetState=='offline')
        {
    $.alert({
                                   icon:'fa fa-exclamation-triangle',
                                   columnClass: 'col-md-12',
                                   title: 'Internet Status',
                                   content: 'You are offline now, please check internet connection.' // hides content block.
                               });
        }
    var uiState = this.state.uiState;
    uiState.map(function(item, index) {
      if (parseInt(item.packed_qty) < parseInt(this.state.poQtyMapFromLocal[item.po_id]["totalCount"])) {
        // send out an email alert to HQ that picked up qty is less than
        // packed qty
        var details = this.props.poData[item.po_id][0];
        var friendlyPOName = details.vendor_name +
              '-' + details.outlet_name +
              '-' + (item.po_id).toString(36).toUpperCase();
        var subject = "ALERT: Picked up qty is less than Packed qty";
        var body = "Restaurant ID - " + RESTAURANT_ID + "\n" +
                "Outlet ID- " + item.selectedOutletId + "\n" +
                "Picked Qty- " + parseInt(item.packed_qty) + "\n" +
                "Original Qty- " + parseInt(this.state.poQtyMapFromLocal[item.po_id]["totalCount"]) + "\n" +
                "Friendly PO Name- " + friendlyPOName;
        console.log(subject + " " + body);
        $.ajax({
          type: 'POST',
          url: HQ_URL + '/food_vendor/send_mail',
          data: JSON.stringify({"mail_address": SENDER_EMAIL,
                "subject": subject,
                "body": body}),
          success: function(data) {
            console.log(data);
           },
          error: function(jqxhr, textStatus, error) {
            var err_msg = textStatus + ", " + jqxhr.responseText;
            console.error("Sending alert mail failed: " + err_msg);
          },
          contentType: "application/json",
          dataType: 'text'
        });
        var delta = parseInt(this.state.poQtyMapFromLocal[item.po_id]["totalCount"]) - parseInt(item.packed_qty);
        uiState[index]["barcodes"] = uiState[index]["barcodes"].slice(0, uiState[index]["barcodes"].length-delta);
      }
    }, this);
 // Android.RemoveKeyPairValue(false);
 var packedPo_id=[];
       for (var i = 0; i < this.state.uiState.length; i++) {
           packedPo_id.push(this.state.uiState[i].po_id);
         }
    // get the current packing details and push
     var confirmedPOData =[{"data": uiState,
             "signature": this.state.signaturePad.toDataURL()
         }];
         var encodedValue=window.btoa(JSON.stringify(confirmedPOData));
// var poConfirmed = [];
//                poConfirmed.push({ "po_id": confirmedPOData.data[0].po_id, "confirmedPOData": confirmedPOData });
var transactionCompletion = $.confirm({
                               icon:'fa fa-spinner fa-pulse fa-2x fa-fw',
                               columnClass: 'col-md-12',
                               title: 'Transportation Status',
                               cancelButton: false, // hides the cancel button.
                               confirmButton: false, // hides the confirm button.
                               closeIcon: false, // hides the close icon.
                               content: 'Please wait while the transportation completes' // hides content block.
                           });
    $.ajax({
       type: 'POST',
       url: HQ_URL + '/food_vendor/new_batches',
       data: {"batch":encodedValue},
       dataType: 'text',
       crossDomain: true,
        success: function (data)
        {
        transactionCompletion.close();
            console.log(data);
            this.wipeFirebaseStock();
            // Hiding the dialog
            $("#transporterDialog").modal("hide");
            renderApp.immediateUIReplication(packedPo_id);
        } .bind(this),
        error: function (jqxhr, textStatus, error)
        {
         transactionCompletion.close();
           var dataFromSP = Android.GetPODataFromSP(false);
                     if (dataFromSP != undefined && dataFromSP != "undefined")
                     {
                         var parsedData = JSON.parse(dataFromSP);
                         var restaurantAvail = parsedData[RESTAURANT_ID];
                         if (restaurantAvail != undefined)
                         {
                             var rest = _.findWhere(parsedData[RESTAURANT_ID].poConfirmed, { po_id: uiState[0].po_id });
                             if (rest == undefined)
                             {
                                 parsedData[RESTAURANT_ID].poConfirmed.push({ "po_id": confirmedPOData[0].data[0].po_id, "confirmedPOData": confirmedPOData[0] });
                             }

                         } else
                         {
                             var poConfirmed = [];
                             poConfirmed.push({ "po_id": confirmedPOData[0].data[0].po_id, "confirmedPOData": confirmedPOData[0] });
                              parsedData[RESTAURANT_ID] = { "poConfirmed": poConfirmed };
                         }

                          var jsonData = JSON.stringify(parsedData);
                          Android.UpdatePODataToSP(jsonData, false);
                     } else
                     {
                         var poConfirmed = [];
                         poConfirmed.push({ "po_id": confirmedPOData[0].data[0].po_id, "confirmedPOData": confirmedPOData[0] });
                         var items = {};
                         items[RESTAURANT_ID] = { "poConfirmed": poConfirmed };
                         var poConfirmedReferenceLocal = JSON.stringify(items);
                         Android.SendPODataToSP(poConfirmedReferenceLocal, false);
                     }
            var err_msg = textStatus + ", " + jqxhr.responseText;
           // console.error("Creating new batch failed: " + err_msg);
            this.wipeFirebaseStock();
            $("#transporterDialog").modal("hide");
            renderApp.immediateUIReplication(packedPo_id);
        }.bind(this)
    });
  },
  wipeFirebaseStock: function() {
    // get the restaurant and outlet id
    // get the firebase data
    // go through the outlet and then the food_item ids and set the packed:0
    // commit it to firebase
    var firebaseRef = new Firebase(FIREBASE_URL + "/" + RESTAURANT_ID);
    for (var i = 0; i < this.state.uiState.length; i++) {
      var po_id = this.state.uiState[i].po_id;
      var poRef = firebaseRef.child(po_id);
      poRef.remove();

        var barcodeRefValue = Android.GetPODataFromSP(true);
        var parsedData=JSON.parse(barcodeRefValue);
        delete parsedData[RESTAURANT_ID].pos[po_id];
        var jsonData = JSON.stringify(parsedData);
        Android.UpdatePODataToSP(jsonData,true);
         }
  },
  updatePOQty: function(index, event) {
    // go through the unused outlets , get the po_id, get the qty from
    // poqty map and then populate and mark the outlet as used
    var selectedOutletId = event.target.value;
    console.log("outlet dropdown changed");
    // If the value is changed before a dropdown is selected, just return
    if (this.state.uiState == null) {
      return;
    }
    var uiState = this.state.uiState;
    var allOutlets = this.state.allOutlets;
    uiState[index]["selectedOutletId"] = selectedOutletId;
    uiState[index]["error_msg"] = '';
    var allSelectedOutlets = uiState.map(function(item) {
      return item["selectedOutletId"];
    });
    for (var i = 0; i < allOutlets.length; i++) {
      var item = allOutlets[i];
      if (item.outlet_id == selectedOutletId) {
        uiState[index]["po_id"] = item.po_id;
        uiState[index]["packed_qty"] = this.state.poQtyMapFromLocal[item.po_id]["totalCount"];
        uiState[index]["barcodes"] = this.state.poQtyMapFromLocal[item.po_id]["barcodes"];
      }
      // changing the remaining selected outlets
      if (allSelectedOutlets.indexOf(item.outlet_id.toString()) != -1) {
        allOutlets[i]["used"] = true;
      } else {
        allOutlets[i]["used"] = false;
      }
    }
    this.setState({
      uiState: uiState,
      allOutlets: allOutlets,
      poQtyMapFromLocal: this.state.poQtyMapFromLocal,
      signaturePad: this.state.signaturePad
    });
  },
  updatePackedQty: function(index, event) {
    uiState = this.state.uiState;
    var po_id = uiState[index]["po_id"];
    if (parseInt(event.target.value) > this.state.poQtyMapFromLocal[po_id]["totalCount"]) {
      console.log("Picked up qty cannot be more than packed");
      uiState[index]["error_msg"] = "Picked up qty cannot be more than packed";
    } else {
      uiState[index]["packed_qty"] = event.target.value;
      uiState[index]["error_msg"] = "";
    }
    this.setState({
      uiState: uiState,
      allOutlets: this.state.allOutlets,
      poQtyMapFromLocal: this.state.poQtyMapFromLocal,
      signaturePad: this.state.signaturePad
    });
  },
  render: function() {
    var index = -1;
    var transporterRows = this.state.uiState.map(function(item) {
      index++;
      var outletDropdown = item.outlets.map(function(outlet) {
        return (
          <option value={outlet.outlet_id}>{outlet.outlet_name}</option>
        );
      });
      return (
        <div style={{marginBottom: '10px'}}>
          <div style={{display: 'inline-block', width: '170px'}}>
          OUTLET: <select value={item.selectedOutletId} onChange={this.updatePOQty.bind(this, index)}>
           {outletDropdown}
          </select>
          </div>
          <div style={{display: 'inline-block', width: '100px'}}>
          PO: <select disabled={true}>
           <option>{item.po_id}</option>
          </select>
          </div>
          <div style={{display: 'inline-block', width: '130px'}}>
          QTY: <input type="number" value={item.packed_qty} onChange={this.updatePackedQty.bind(this, index)} style={{width: '50px'}} />
          </div>
          <div style={{display: 'inline-block', width: '150px', color: 'red', verticalAlign: 'middle'}}>
            {item.error_msg}
          </div>
        </div>
        );
    }, this);
    var addBtnStyle = {
      backgroundColor: '#CCCCCC',
      padding: '5px',
      textAlign: 'center',
      cursor: 'pointer',
      fontSize: '17px'
    };
    return (
      <div id="transporterDialog" className="modal fade" tabIndex="-1">
        <div className="modal-dialog" style={{top: '75px'}}>
          <div className="modal-content">
            <div className="modal-header" style={{padding: '10px', textAlign: 'center'}}>
              <h4>Transporter Pickup Screen</h4>
            </div>
            <div className="modal-body" style={{paddingLeft: '15px', paddingRight: '15px'}}>
              {transporterRows}
              <div style={addBtnStyle} onClick={this.addRow}><img src="img/Add Item.png" height="20" style={{marginRight: '5px'}} />Add PO</div>
            </div>
            <div className="modal-footer" style={{paddingLeft: '15px', paddingRight: '15px'}}>
              <div style={{marginBottom: '10px'}}>
              <div style={{display: 'inline-block', paddingRight: '15px'}}>Please sign here -</div>
              <canvas width='300' height='100' style={{verticalAlign: 'middle', border: 'solid 1px black'}}></canvas>
              </div>
              <button id="packToHQ" className="btn btn-raised btn-info" onClick={this.confirmPacking} >Confirm</button>
              <button className="btn btn-raised" data-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
});
