  /*
Firebase DS-
Rest_id/
  PO_id/
    food_item_id/
      barcodes: ["barcode1", "barcode1"] --> this list gets appended
*/
//var SocketIO = require('react-native-swift-socketio');
var dataMatcode;
var PackingFlowScreen = React.createClass({
  getInitialState: function() {

    return {packed_now: 0};
  },
  sealingComplete: function() {
    //Disabling the button on click
    $("#sealing_complete_btn").prop("disabled", true);
    console.log(dataMatcode);
    // call the printQR function to print the qr code
    POItemRendered.printQR(this.props.item_id,
                          this.props.master_id,
                          this.props.veg,
                          this.props.ingredients1a,
                          this.props.ingredients1b,
                          this.props.ingredients2,
                          this.props.ingredients3,
                          this.props.side_order,
                          this.props.city,
                          this.props.outlet_id,
                          this.props.vendor_name,
                          this.props.outlet_name,
                          dataMatcode,
                          "NORMAL"
                          );
  },
  reprintBarcode: function()
    {
   POItemRendered.printQR(this.props.item_id,
                            this.props.master_id,
                            this.props.veg,
                            this.props.ingredients1a,
                            this.props.ingredients1b,
                            this.props.ingredients2,
                            this.props.ingredients3,
                            this.props.side_order,
                            this.props.city,
                            this.props.outlet_id,
                            this.props.vendor_name,
                            this.props.outlet_name,
                            "EXTRA");
    //POItemRendered.RePrintQR();
    },
  barcodePrinted: function(barcode,datamatrixcode,origin) {
    // This check is there because we don't want to add the barcode
    // if it is from extra QR
    if ($("#packingScreen").css("display") == "block" && origin!="EXTRA") {
      // Enabling the button back
      $("#sealing_complete_btn").prop("disabled", false);
      // Checking if the qty is sufficient
      var delta_qty = this.props.total_qty - this.props.packed_qty - this.state.packed_now;

      if (delta_qty > 0) {
        // Update the barcode in the firebase
        var firebaseRef = new Firebase(FIREBASE_URL + "/" +
          RESTAURANT_ID + "/" +
          this.props.po_id + "/" +
          this.props.item_id);
        var barcodeRef = firebaseRef.child("barcodes");
        barcodeRef.push({"barcode":barcode,"data_matrix":datamatrixcode});
       //Android.RemoveKeyPairValue(true);
      var dataFromSP = Android.GetPODataFromSP(true);
                     if (dataFromSP != undefined && dataFromSP != "undefined")
                          {
                              var parsedData = JSON.parse(dataFromSP);
                              var rest = _.findWhere(parsedData, { restaurant_id: RESTAURANT_ID });
                              if (rest != undefined)
                              {
                                  var pos = _.findWhere(rest.pos, { po_id: this.props.po_id });
                                  if (pos != undefined)
                                  {
                                      var items = _.findWhere(pos.items, { item_id: this.props.item_id })
                                      if (items != undefined)
                                      {
                                          var barcode_datamatrix={};
                                          barcode_datamatrix={"barcode":barcode,"data_matrix":datamatrixcode};
                                          items.barcodes.push(barcode_datamatrix);
                                      } else
                                      {

                                         var barcode_datamatrix={};
                                         barcode_datamatrix={"barcode":barcode,"data_matrix":datamatrixcode};
                                         var barcodes = [barcode_datamatrix];
                                          var items = {};
                                          parsedData[RESTAURANT_ID].pos[this.props.po_id].items[this.props.item_id] = { "item_id": this.props.item_id, "barcodes": barcodes };
                                      }
                                  } else
                                  {

                                   var barcode_datamatrix={};
                                   barcode_datamatrix={"barcode":barcode,"data_matrix":datamatrixcode};
                                   var barcodes = [barcode_datamatrix];
                                      var items = {};
                                      items[this.props.item_id] = { "item_id": this.props.item_id, "barcodes": barcodes };
                                      var pos = {};
                                      parsedData[RESTAURANT_ID].pos[this.props.po_id] = { "po_id": this.props.po_id, "items": items };
                                  }

                              } else
                              {

                                 var barcode_datamatrix={};
                                 barcode_datamatrix={"barcode":barcode,"data_matrix":datamatrixcode};
                                 var barcodes = [barcode_datamatrix];

                                  var items = {};
                                  items[this.props.item_id] = { "item_id": this.props.item_id, "barcodes": barcodes };

                                  var pos = {};
                                  pos[this.props.po_id] = { "po_id": this.props.po_id, "items": items };

                                  var restaurants = {};
                                  parsedData[RESTAURANT_ID] = { "restaurant_id": RESTAURANT_ID, "pos": pos };
                              }

                              var jsonData = JSON.stringify(parsedData);
                              Android.UpdatePODataToSP(jsonData, true);
                          }
                          else
                          {
                              var barcode_datamatrix={};
                              barcode_datamatrix={"barcode":barcode,"data_matrix":datamatrixcode};
                              var barcodes = [barcode_datamatrix];

                              var items = {};
                              items[this.props.item_id] = { "item_id": this.props.item_id, "barcodes": barcodes };

                              var pos = {};
                              pos[this.props.po_id] = { "po_id": this.props.po_id, "items": items };

                              var restaurants = {};
                              restaurants[RESTAURANT_ID] = { "restaurant_id": RESTAURANT_ID, "pos": pos };

                              var barcodeReferenceLocal = JSON.stringify(restaurants);
                              Android.SendPODataToSP(barcodeReferenceLocal, true);
                          }
        console.log("Received new barcode");
        var packed_now = this.state.packed_now;
        packed_now++;
        $("#scanInput").val("");
        this.setState({packed_now: packed_now},
            function() {
              console.log("Packed now is ", this.state.packed_now);
            });
        // Closing the dialog if this is the last item
        if (delta_qty - 1 == 0) {
          this.packingDone();
        }
      } else if (delta_qty == 0) {
        this.packingDone();
      } else {
        /// XXX: This should not happen
        console.log("More items packed");
        return;
      }
    } else if ($("#poPackingDialog").css("display") == "block" || origin=="EXTRA") {
      var qrPrintCount = $("#qr-"+food_item_id.toString()).text();
      // Increasing the value of the qr print count
      $("#qr-"+food_item_id.toString()).text(parseInt(qrPrintCount)+1);
    }
  },
  // setup the event handler for firebase event packing
  subscribeToFirebase: function() {
    var firebaseRef = new Firebase(FIREBASE_URL + "/" +
      RESTAURANT_ID + "/" +
      this.props.po_id + "/" +
      this.props.item_id);
    var packed_now = 0;
    firebaseRef.child("barcodes").once("value", function(snapshot) {
      if (snapshot.val() == null) {
        return true;
      }
      var packed_now = Object.keys(snapshot.val()).length;
      if (this.props.total_qty - this.props.packed_qty - packed_now == 0) {
        this.packingDone();
        return;
      }
      // Updating the firebase state on value change
      this.setState({packed_now: packed_now},
        function() {
          console.log("Packed now is ", this.state.packed_now);
        });
    }.bind(this), function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
  },
  componentDidMount: function() {
    $("#packingScreen").modal("show");
    React.findDOMNode(this.refs.packing_video).play();
    this.subscribeToFirebase();
 /*$('#scanInput').focus(function(){
        console.log("In focus");
        Android.notEdit();
    });*/
    $('body').on('shown.bs.modal', '#packingScreen', function () {
       $("#scanInput").focus();
       $("#scanInput").attr('maxlength','9');
       });
$("#scanInput").focusout(function(){
       $("#scanInput").focus();
       $("#scanInput").attr('maxlength','9');
});
      // $("#scanInput").on('change',function(){
         socket.on('chat message', function(data){
               //clientValue = data;
               //alert(data);

         var IsPackingScreenOpen = $("#packingScreen").data('bs.modal').isShown;
           if(IsPackingScreenOpen)
           {
           // Android.RemoveKeyPairValue(true);
           var barcodeRef = Android.GetPODataFromSP(true);
           if(barcodeRef!= undefined)
           {
           var barcodeRefValue = JSON.parse(Android.GetPODataFromSP(true));
           var scannedCode = data;
           if((barcodeRefValue != undefined) && (scannedCode != "") && (barcodeRefValue[RESTAURANT_ID] != undefined))
           {
           var isduplicate = false;
           _.each(barcodeRefValue[RESTAURANT_ID].pos, function(obj) {
                                       _.each(obj.items, function(item){
                                        if(_.some(item.barcodes, {data_matrix:scannedCode}))
                                                                  {
                                                                  $("#scanInput").val('');
                                                                      //console.log("DataMatrix code already exists");
                                                                         	$.confirm({
                                                                                                               icon:'fa fa-exclamation-triangle',
                                                                                                              columnClass: 'col-md-12',
                                                                                                              title: 'Scanning Status',
                                                                                                              cancelButton: Ok, // hides the cancel button.
                                                                                                              confirmButton: false, // hides the confirm button.
                                                                                                              closeIcon: false, // hides the close icon.
                                                                                                              content: 'The Scanned Code Already Exists.' // hides content block.
                                                                                     });

           isduplicate = true;

                                                                  }
                                       });
                                     });
           if((!isduplicate))
           {
            console.log("Sealing Process");
                                       //console.log($(this).val());
                                                     var datamatrixcode = data;
                                                     console.log(datamatrixcode);
                                                     dataMatcode = data;
                                                         // call the printQR function to print the qr code

                                                       sealingComplete();
           }

           }
           else if(barcodeRefValue[RESTAURANT_ID] == undefined)
           {
           console.log("sealing when undefined");
                      var datamatrixcode = data;
                      console.log(datamatrixcode);
                      dataMatcode = data;
                      sealingComplete();
           }
           }
           else
           {
            console.log("First time Sealing Process");
           var datamatrixcode = data;
           console.log(datamatrixcode);
           dataMatcode = data;
           sealingComplete();
           }
           }
           });
 },
  packingDone: function() {
    $("#packingScreen").modal("hide");
  },

  render: function() {
    var packedPercent = (this.props.packed_qty / this.props.total_qty) * 100;
    packedPercent = packedPercent + '%';
    packedPercentStyle = {width: packedPercent};
    var currentPackedPercent = (this.state.packed_now / this.props.total_qty) * 100;
    currentPackedPercent = currentPackedPercent + '%';
    currentPackedPercentStyle = {width: currentPackedPercent};
    var sealingCompleteButton = null;
    if (SHOW_SEALING_COMPLETE == "true") {
      sealingCompleteButton = (
        <button id="sealing_complete_btn" className="btn btn-raised" onClick={this.sealingComplete} >Sealing Complete</button>
        )
    }
    var trayImageStyle = {  };
    var modalDialogStyle = {
      margin: '10px auto',
      width: '1000px'
    };
    var cardStyle = {
      display: 'inline-block',
      verticalAlign: 'middle',
      width: '50%'
    };
    var numStyle = {
      fontSize: '70px',
      fontWeight: 'bold',
      textAlign: 'center'
    };
    var scanInputStyle = {
         opacity: 0
        };
    return (
      <div id="packingScreen" ref="packingScreen" className="modal fade" tabIndex="-1">
        <div className="modal-dialog" style={modalDialogStyle}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{textAlign: 'center', backgroundColor: '#D4D4D4', margin: '0px auto'}}>PACK</h2>
            </div>

            <input style={scanInputStyle} type="text" id="scanInput" />
            <div className="modal-body">

              <div>
                <div style={cardStyle}>
                <img src={HQ_URL + "/food_item/tray_image/" + this.props.item_id} style={{height: '300px'}} />
                </div>

                <div style={cardStyle}>
                <video ref="packing_video" autoPlay="true" loop muted style={{height: '200px'}}>
                  <source src="file:///sdcard/templates/packing.mp4" type="video/mp4" />
                Your browser does not support the video tag.
                </video>
                </div>
              </div>

              <div style={{border: '1px solid', padding: '5px'}}>
                <div>QUANTITY</div>
                <div className="progress" style={{height: '30px'}} >
                  <div className="progress-bar progress-bar-success" style={packedPercentStyle}></div>
                  <div className="progress-bar progress-striped active" style={currentPackedPercentStyle}></div>
                </div>
                <div>
                <div style={{color: '#009688', display: 'inline-block', marginLeft: '170px'}}>
                <div className="fixed_width">Current Packed</div>
                <div style={numStyle}>{this.state.packed_now}</div>
                </div>
                <div style={{color: '#C8C8C8', display: 'inline-block', marginLeft: '150px'}}>
                <div className="fixed_width">Remaining</div>
                <div style={numStyle}>{this.props.total_qty - this.props.packed_qty - this.state.packed_now}</div>
                </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
            <button className="btn btn-info btn-raised" onClick={this.packingDone} >Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
});
