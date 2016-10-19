// This file contains the PO related views and dialogs
// The main polist view, the po confirmation view and the po item dialog
var barcodeDetails={};
var POListView = React.createClass({
  openPOPreview: function(po_id, event) {

  $.ajax({
        url: HQ_URL + '/outlet_mobile/update_po_status/',
        dataType: 'json',
        contentType: 'application/json',
        data:JSON.stringify({"po_id":po_id,"status":"Packing Started"}),
        success: function(result) {
        },
        error: function(jqxhr, textStatus, error) {
          var err_msg = textStatus + ", " + jqxhr.responseText;
          console.error("Status move is failed: " + err_msg);
        }
      });
    var details = this.props.poData[po_id][0];
    var friendlyPOName = details.vendor_name +
          '-' + details.outlet_name +
          '-' + (po_id).toString(36).toUpperCase();
    var poTime = (new Date(details.scheduled_delivery_time)).toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
    var poHeaderStyle = {
        border: '2px solid ' + simpleStorage.get("outlet-" + details.outlet_name),
        margin: '5px',
        padding: '10px'
      };

    // Creating the PO header for the preview
    var poPreviewHeader = (
        <div style={poHeaderStyle}>
          <div style={{display: 'inline-block', width: '260px'}}>{friendlyPOName}</div>
          <div style={{display: 'inline-block', width: '240px'}}>{details.outlet_name}</div>
          <div style={{display: 'inline-block'}}>{poTime}</div>
        </div>
      );
    // Getting the list of items in the PO
    var allEmpty = true;
    var poItems = this.props.poData[po_id].map(function(item) {
      var current_packed_qty = 0;
      if (this.props.packingData &&
          this.props.packingData[po_id] &&
          this.props.packingData[po_id][item.food_item_id]) {
        current_packed_qty = Object.keys(this.props.packingData[po_id][item.food_item_id]["barcodes"]).length;
      }
      var tdStyle = {
        padding: '5px',
        textAlign: 'center'
      };
      if (item.total_qty - item.packed_qty - current_packed_qty > 0) {
        allEmpty = false;
      }
      return (
        <tr>
          <td style={tdStyle}>{item.master_id}- {item.item_name}</td>
          <td style={tdStyle}>{item.total_qty}</td>
          <td style={tdStyle}>{item.total_qty - item.packed_qty - current_packed_qty}</td>
        </tr>
        )
    }, this);
    React.unmountComponentAtNode(document.getElementById('poPreviewContainer'));
    POPreviewRendered = React.render(<POPreviewDialog
        poData={this.props.poData}
        packingData={this.props.packingData}
        poPreviewHeader={poPreviewHeader}
        poId={po_id}
        allEmpty={allEmpty}
        poItems={poItems} />,
      document.getElementById('poPreviewContainer'));
  },
  render: function() {
    if (this.props.poData == null) {
      return (
        <div></div>
        );
    }
    // This creates the list of PO items to bordere shown from the poData prop
    var listNodes = Object.keys(this.props.poData).map(function(po_id) {
      var details = this.props.poData[po_id][0];
      // Creating the PO friendly name
      // XXX: Refactor this
      var friendlyPOName = details.vendor_name +
          '-' + details.outlet_name +
          '-' + (po_id).toString(36).toUpperCase();
      // Creating the random color and store it against the outlet name
      if (simpleStorage.get("outlet-"+details.outlet_name) == undefined) {
        var color = randomColor({luminosity: 'bright'});
        simpleStorage.set("outlet-"+details.outlet_name, color);
      }
      var poHeaderStyle = {
        border: '2px solid ' + simpleStorage.get("outlet-" + details.outlet_name),
        width: '390px',
        margin: '5px',
        marginBottom: '20px',
        backgroundColor: 'white',
        borderRadius: '5px',
        padding: '10px',
        cursor: 'pointer'
      };
      var poTime = (new Date(details.scheduled_delivery_time)).toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
      return (
        <div key={po_id} style={poHeaderStyle} onClick={this.openPOPreview.bind(this, po_id)}>
          <div style={{display: 'inline-block', width: '160px'}}>{friendlyPOName}</div>
          <div style={{display: 'inline-block', width: '110px'}}>{details.outlet_name}</div>
          <div style={{display: 'inline-block'}}>{poTime}</div>
        </div>
      );
    }, this);
    var poListStyle = {
      height: '500px',
      marginLeft: '50px'
    };
    return (
      <div style={poListStyle}>
        {listNodes}
      </div>
    );
  }
});

// -----------------------------------------------------------------------------

var POPreviewDialog = React.createClass({
  openPoPackingDialog: function() {
    $("#poPreviewDialog").modal("hide");
    React.unmountComponentAtNode(document.getElementById('poPacking'));
    POItemRendered = React.render(<POItemDialog
        poItemHeader={this.props.poPreviewHeader}
        poData={this.props.poData}
        packingData={this.props.packingData}
        poId={this.props.poId} />,
      document.getElementById('poPacking'));
  },
  componentDidUpdate: function(prevProps, prevState) {
    $.material.init();
  },
  componentDidMount: function() {
    //$("#poPreviewDialog").modal("show");
    this.openPoPackingDialog();
  },
  render: function() {
    var confirmButton = null;
    if (!this.props.allEmpty) {
      confirmButton = (
        <button className="btn btn-raised btn-info" onClick={this.openPoPackingDialog} >Confirm</button>
        )
    }
    return (
      <div id="poPreviewDialog" className="modal fade" tabIndex="-1">
        <div className="modal-dialog" style={{top: '75px'}}>
          <div className="modal-content">
            <div className="modal-header" style={{padding: '0px', paddingTop: '1px'}}>
              {this.props.poPreviewHeader}
            </div>
            <div className="modal-body" style={{maxHeight: '300px', overflow: 'scroll'}}>
              <table style={{margin: '0 auto'}}>
              <thead style={{borderTop: '1px solid black', borderBottom: '1px solid black'}}>
                <tr>
                  <th style={{width: '250px', padding: '5px', textAlign: 'center'}}>Item ID + Name</th>
                  <th style={{width: '115px', padding: '5px', textAlign: 'center'}}>Total</th>
                  <th style={{width: '115px', padding: '5px', textAlign: 'center'}}>To Pack</th>
                </tr>
              </thead>
              <tbody>
                {this.props.poItems}
              </tbody>
              </table>
            </div>
            <div className="modal-footer">
              {confirmButton}
              <button className="btn btn-raised" data-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

// -----------------------------------------------------------------------------

var POItemDialog = React.createClass({
  componentDidUpdate: function(prevProps, prevState) {
    $.material.init();
  },
  componentDidMount: function() {
    $.material.init();
    $("#poPackingDialog .modal-content .modal-header > div").css("padding-left", "60px");
    $("#poPackingDialog").modal("show");
  },
    openRemoveItemScreen:function()
  {

renderApp.subscribeToFirebase();
   $("#poPackingDialog").modal("hide");
     React.unmountComponentAtNode(document.getElementById('poPacking'));
       React.render(<RemoveItemDialog
                       poData={this.props.poData}
                       poId={this.props.poId}
                       packingData={this.props.packingData}
                       />,
         document.getElementById('poPacking'));

  },
  openPackingScreen: function(po_id,
      total_qty,
      packed_qty,
      currentPackedQty,
      master_id,
      food_item_id,
      veg,
      ingredients1a,
      ingredients1b,
      ingredients2,
      ingredients3,
      side_order,
      city,
      outlet_id,
      vendor_name,
      outlet_name,
      event) {
    $("#poPackingDialog").modal("hide");
    React.unmountComponentAtNode(document.getElementById('packingFlow'));
    PackingFlowRendered = React.render(<PackingFlowScreen
        po_id={po_id}
        total_qty={total_qty}
        packed_qty={packed_qty}
        master_id={master_id}
        item_id={food_item_id}
        veg={veg}
        ingredients1a={ingredients1a}
        ingredients1b={ingredients1b}
        ingredients2={ingredients2}
        ingredients3={ingredients3}
        side_order={side_order}
        city={city}
        outlet_id={outlet_id}
        vendor_name={vendor_name}
        outlet_name={outlet_name} />,
      document.getElementById('packingFlow'));

if (currentPackedQty == 0) {

	Android.priorLabelPrint(master_id,
		veg,
		ingredients1a,
		ingredients1b,
		ingredients2,
		ingredients3,
		side_order,
		vendor_name,
		outlet_name,
		PRINTER_IP);

}
  },
  RePrintQR: function(){
     if(! _.isEmpty(barcodeDetails))
     {
      Android.printLabel(barcodeDetails.master_id,
                             barcodeDetails.veg,
                             barcodeDetails.ingredients1a,
                             barcodeDetails.ingredients1b,
                             barcodeDetails.ingredients2,
                             barcodeDetails.ingredients3,
                             barcodeDetails.side_order,
                             barcodeDetails.vendor_name,
                             barcodeDetails.outlet_name,
                             barcodeDetails.barcode,
                             barcodeDetails.time,
                             barcodeDetails.PRINTER_IP);
       }
    },
  printQR: function(food_item_id,
                    master_id,
                    veg,
                    ingredients1a,
                    ingredients1b,
                    ingredients2,
                    ingredients3,
                    side_order,
                    city,
                    outlet_id,
                    vendor_name,
                    outlet_name,
                    datamatrixcode,
                    source,
                    total_qty,
                    packed_qty,
                    event) {
    // Setting the timeout for enabling the box after 1 sec
    $("#"+food_item_id.toString()).prop('disabled', true);
    setTimeout(function(){
      $("#"+food_item_id).prop('disabled', false);
    }.bind(food_item_id.toString()), 1000);

   /* // Increasing the value of the current print count
    var current_print_count = CURRENT_PRINT_COUNT;
    if (MAX_PRINT_COUNT - current_print_count <= 0) {
      // Resetting the print count
      CURRENT_PRINT_COUNT = 0;
      simpleStorage.set("CURRENT_PRINT_COUNT", CURRENT_PRINT_COUNT);

      //Showing the same alert twice
      alert("Its time to change the Roll");

      alert("Click here to print dummy and throw the printed labels");
      for (var i = 0; i < 3; i++) {
        setTimeout(function(){
          Android.printTestLabel(PRINTER_IP);
        }, 2000*i);
      }
      return false;
    } else {
      CURRENT_PRINT_COUNT++;
      simpleStorage.set("CURRENT_PRINT_COUNT", CURRENT_PRINT_COUNT);
    }*/

     CURRENT_PRINT_COUNT++;
          simpleStorage.set("CURRENT_PRINT_COUNT", CURRENT_PRINT_COUNT);
    // translating the boolean to a string
    veg = veg ? "VEG" : "NON-VEG";
    ingredients1a = ingredients1a == null ? "" : ingredients1a;
    ingredients1b = ingredients1b == null ? "" : ingredients1b;
    ingredients2 = ingredients2 == null ? "" : ingredients2;
    ingredients3 = ingredients3 == null ? "" : ingredients3;
    side_order = side_order == null ? "" : side_order;
    // Generating the barcode
    var barcode = city;
    barcode += this.pad(outlet_id, 3);
    barcode += vendor_name;
    barcode += this.pad(food_item_id.toString(36).toUpperCase(), 4);
    var now = new Date();
    var yyyy = now.getFullYear().toString();
    var mm = (now.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = now.getDate().toString();
    barcode += dd[1]?dd:"0"+dd[0]; // padding
    barcode += mm[1]?mm:"0"+mm[0];
    barcode += yyyy;
    var hh = now.getHours().toString();
    var mm = now.getMinutes().toString();
    hh = hh[1]?hh:"0"+hh[0];
    mm = mm[1]?mm:"0"+mm[0];
    if (source == "NORMAL") {
      // storing the last time
      HH = hh;
      MM = mm;
    } else if (source == "EXTRA") {
      // If a normal barcode was printed, take the old value
      if (HH && MM) {
        hh = HH;
        mm = MM;
      } else { // if no barcode was printed normally before, take the current
        // value
        HH = hh;
        MM = mm;
      }
    }
    barcode += hh;
    barcode += mm;
    var time = hh+mm;
    console.log("printing label with barcode - " + barcode);
       barcodeDetails={};
        barcodeDetails={
        "master_id":master_id
        ,"veg":veg
        ,"ingredients1a":ingredients1a
        ,"ingredients1b": ingredients1b
        ,"ingredients2":ingredients2
        ,"ingredients3":ingredients3
        ,"side_order":side_order
        ,"vendor_name":vendor_name
        ,"outlet_name":outlet_name
        ,"barcode":barcode
        ,"time":time
        ,"PRINTER_IP":PRINTER_IP
        ,"DataMatrixCode":datamatrixcode
        };
    Android.printLabel(master_id,
                        veg,
                        ingredients1a,
                        ingredients1b,
                        ingredients2,
                        ingredients3,
                        side_order,
                        vendor_name,
                        outlet_name,
                        barcode,
                        time,
                        PRINTER_IP,
                        datamatrixcode,
                        source);
    var packedQty=packed_qty+1;
    if(packedQty<total_qty)
    {
Android.priorLabelPrint(master_id,
		veg,
		ingredients1a,
		ingredients1b,
		ingredients2,
		ingredients3,
		side_order,
		vendor_name,
		outlet_name,
		PRINTER_IP);
    }
  },
  pad: function(num, size) {
    var s = String(num);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
 },
  render: function() {
    var poItems = this.props.poData[this.props.poId].map(function(item) {
      var current_packed_qty = 0;
      if (this.props.packingData &&
          this.props.packingData[this.props.poId] &&
          this.props.packingData[this.props.poId][item.food_item_id]) {
        current_packed_qty = Object.keys(this.props.packingData[this.props.poId][item.food_item_id]["barcodes"]).length;

      }
      var tdStyle = {
        padding: '5px',
        width:'200px',
        textAlign: 'center'
      };
      var itemTdStyle = {
        padding: '5px',
        width:'350px',
        textAlign: 'left'
      };
      var toPack= item.total_qty - item.packed_qty - current_packed_qty;
      var buttonId = item.food_item_id;
      return (
        <tr>
          <td style={itemTdStyle}>{item.master_id}- {item.item_name}</td>
          <td style={tdStyle}>{item.total_qty}</td>
          <td style={tdStyle}>{toPack}</td>
          <td>
          <button disabled={!toPack} className="btn btn-raised btn-info" onClick={this.openPackingScreen.bind(this,
                        this.props.poId,
                        item.total_qty,
                        item.packed_qty,
                        current_packed_qty,
                        item.master_id,
                        item.food_item_id,
                        item.veg,
                        item.ingredients1a,
                        item.ingredients1b,
                        item.ingredients2,
                        item.ingredients3,
                        item.side_order,
                        item.city,
                        item.outlet_id,
                        item.vendor_name,
                        item.outlet_name)}>PACK</button>&nbsp;&nbsp;
<button id={item.food_item_id} style={{display: 'none'}} className="btn btn-raised btn-material-pink-800" onClick={this.printQR.bind(this,
                        item.food_item_id,
                        item.master_id,
                        item.veg,
                        item.ingredients1a,
                        item.ingredients1b,
                        item.ingredients2,
                        item.ingredients3,
                        item.side_order,
                        item.city,
                        item.outlet_id,
                        item.vendor_name,
                        item.outlet_name,
                        "EXTRA")} >EXTRA</button>
          <div style={{display: 'inline-block', marginLeft: '5px'}}>
         <span style={{display: 'none'}} id={"qr-"+item.food_item_id}>0</span>
          </div>
          </td>
        </tr>
        )
    }, this);
    return (
      <div id="poPackingDialog" className="modal fade" tabIndex="-1">
        <div className="modal-dialog" style={{width: '800px', top: '75px'}}>
          <div className="modal-content">
            <div className="modal-header" style={{padding: '0px', paddingTop: '1px'}}>
              {this.props.poItemHeader}
            </div>
            <div className="modal-body" style={{maxHeight: '300px', overflow: 'scroll'}}>
              <table style={{margin: '0 auto', width: '700px'}}>
              <thead style={{borderTop: '1px solid black', borderBottom: '1px solid black'}}>
                <tr>
                  <th style={{width: '150px', padding: '5px', textAlign: 'center'}}>Item ID - Name</th>
                  <th style={{width: '75px', padding: '5px', textAlign: 'center'}}>Total</th>
                  <th style={{width: '75px', padding: '5px', textAlign: 'center'}}>To Pack</th>
                  <th style={{width: '300px', padding: '5px', textAlign: 'center'}}></th>
                </tr>
              </thead>
              <tbody>
                {poItems}
              </tbody>
              </table>
            </div>
            <div className="modal-footer">
			  <button id="btn_Remove" className="btn btn-raised btn-material-pink-800" onClick={this.openRemoveItemScreen}>Remove</button>
              <button className="btn btn-raised" data-dismiss="modal">Done</button>
            </div>

          </div>
        </div>
      </div>
    );
  }
});




// -----------------------------------------------------------------------------

var RemoveItemDialog = React.createClass({
  componentDidUpdate: function(prevProps, prevState) {
    $.material.init();
  },
  componentDidMount: function() {
   $.material.init();
   socket.removeAllListeners();
  $("#removeItemDialog").modal("show");
  $('body').on('shown.bs.modal', '#removeItemDialog', function () {
         $("#txt_remove").focus();
         $("#txt_remove").attr('maxlength','9');
         });
         $("#txt_remove").focusout(function(){
          $("#txt_remove").focus();
         });
   console.log(this.props.packingData);
   var p_id=this.props.poId;
   // $("#txt_remove").change(function(){
     socket.on('data-matrix', function(data){
     var Ispopup = $("#removeItemDialog").data('bs.modal').isShown;
     //alert(Ispopup);
     //var p_id=this.props.poId;i
     if(Ispopup)
     {
    var removeCode = data;
    if(removeCode.toString().length>9)
    {
       $.alert({
               icon:'fa fa-exclamation-triangle',
               columnClass: 'col-md-12',
               title: 'Scanning Status',
               content: 'Barcode length should not be more than 9.' // hides content block.
               });
    return false;
    }
     var isdeleted;
     var value;
     var itemId;
     var isFromPOListView=false;
                var barcodeRefValue = JSON.parse(Android.GetPODataFromSP(true));
                        if (barcodeRefValue != undefined)
                        {
                            _.each(barcodeRefValue[RESTAURANT_ID].pos, function(obj) {
                              _.each(obj.items, function(item){

                              isdeleted = _.findWhere(item.barcodes, {data_matrix:removeCode})== undefined ? true : false;
                              if(!isdeleted){
                              value = _.findWhere(item.barcodes, {data_matrix:removeCode});
                              itemId = item.item_id;
                              }
                              	//console.log(item.barcodes);
                                item.barcodes = _.without(item.barcodes, _.findWhere(item.barcodes, {data_matrix:removeCode}))
                              });
                            });
                            console.log(barcodeRefValue);

                            var RemovedDataMatixCode = JSON.stringify(barcodeRefValue);
                            Android.SendPODataToSP(RemovedDataMatixCode, true);
                        }
                        if(value!= undefined)
                        {
                        isFromPOListView=true;
                          var firebaseRef = new Firebase(FIREBASE_URL + "/" +
                                  RESTAURANT_ID + "/" +
                                 p_id + "/" +
                                  itemId+"/barcodes");

                               firebaseRef.on("value", function(snapshot) {
                                // console.log(snapshot.val());
                                if(isFromPOListView){
                                snapshot.forEach(function(childSnapshot) {

                                   var key = childSnapshot.key();
                                   var childData = childSnapshot.val();
                               if(childData.data_matrix==removeCode)
                               {
                                var firebaseRefTest = new Firebase(FIREBASE_URL + "/" +
                                                                 RESTAURANT_ID + "/" +
                                                                p_id + "/" +
                                                                 itemId);
                                   firebaseRefTest.child("barcodes").child(key).remove();
                                   	$.alert({
                                     icon:'fa fa-trash-o',
                                     columnClass: 'col-md-12',
                                     title: 'Alert',
                                     content: 'Succesfully removed.' // hides content block.
                                     });
                                     isFromPOListView=false;
                               }
                                 });
                                 }
                               }, function (errorObject) {
                                 console.log("The read failed: " + errorObject.code);
                               });
                         //barcodeRef =  _.without(barcodeRef,_.findWhere(barcodeRef,value.barcode));
                        $("#txt_remove").val("");
                        }else
                         {
                         $.alert({
                         icon:'fa fa-print',
                         columnClass: 'col-md-12',
                         title: 'Alert',
                         content: 'Item not yet scanned.' // hides content block.
                         });
                         }
                         }
                });
  },
  render: function() {
  //console.log(this.props.packingData);
   var inputStyle = {
           opacity: 0,
            display:'none'
          };
    return (
      <div id="removeItemDialog" className="modal fade" tabIndex="-1">
        <div className="modal-dialog" style={{top: '75px'}}>
          <div className="modal-content">
            <div className="modal-header" style={{padding: '0px', paddingTop: '1px'}}>

            </div>
            <div className="modal-body" style={{maxHeight: '300px', overflow: 'scroll'}}>
                <div>Please scan the damaged item to be removed</div>
                <br/>
                <input type="text" style={inputStyle} id="txt_remove"/>
            </div>
            <div className="modal-footer">

              <button className="btn btn-raised" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
});