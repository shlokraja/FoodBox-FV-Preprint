// Component to hold the item list view

var ItemListView = React.createClass({
  openItemDialog: function(item_id, event) {
    var poList = this.refreshItemDialog(item_id);
    this.refs.itemListDialog.setState({item_id: item_id, poList: poList});
    // show the modal
    $("#itemListDialog").modal("show");
  },
  printQR: function() {
    Android.printLabel();
  },
  refreshItemDialog: function(item_id) {
    var poToItem = this.poToItem();
    var itemData = poToItem[item_id];
    // populate data of the modal
    var poList = itemData.map(function(item) {
      var friendlyPOName = item.vendor_name +
          '-' + item.outlet_name +
          '-' + (item.po_id).toString(36).toUpperCase();
      if (simpleStorage.get("outlet-"+item.outlet_name) == undefined) {
        var color = randomColor({luminosity: 'bright'});
        simpleStorage.set("outlet-"+item.outlet_name, color);
      }
      var poHeaderStyle = {
        background: simpleStorage.get("outlet-" + item.outlet_name),
        border: '0px solid red'
      };
      if (this.props.poBorderWidth) {
        poHeaderStyle.border = this.props.poBorderWidth[item.po_id] + 'px solid red';
      }
      return (
        <div key={item.po_id}>
        <div style={poHeaderStyle}>friendly PO name - {friendlyPOName}</div>
        Total qty is {item.total_qty}
        Packed qty is {item.packed_qty}
        <button className="btn btn-primary btn-raised" onClick={this.refs.itemListDialog.openPackingScreen.bind(this.refs.itemListDialog, item.po_id, item.total_qty, item.packed_qty)}>PACK</button>
        <button className="btn btn-primary btn-raised" onClick={this.printQR}>EXTRA QR</button>
        </div>
      );
    }, this);
    return poList;
  },
  poToItem: function() {
    // Basically converting the data structure which contains the po as the key
    // to a one where the item_id is the key and then aggregating the individual
    // pos inside it.
    var poToItem = {};
    for (var key in this.props.poData) {
      for (var i = 0; i < this.props.poData[key].length; i++) {
        var current_packed_qty = 0;
        if (this.props.packingData && this.props.packingData.hasOwnProperty(key)) {
          if (this.props.packingData[key][this.props.poData[key][i]["food_item_id"]]) {
            current_packed_qty = this.props.packingData[key][this.props.poData[key][i]["food_item_id"]]["packed"];
          }
        }
        if (poToItem.hasOwnProperty(this.props.poData[key][i].food_item_id)) {
          poToItem[this.props.poData[key][i].food_item_id].push({
            "po_id": key,
            "total_qty": this.props.poData[key][i].total_qty,
            "packed_qty": this.props.poData[key][i].packed_qty,
            "vendor_name": this.props.poData[key][i].vendor_name,
            "outlet_name": this.props.poData[key][i].outlet_name,
            "current_packed_qty": current_packed_qty,
          });
        } else {
          poToItem[this.props.poData[key][i].food_item_id] = [{
            "po_id": key,
            "total_qty": this.props.poData[key][i].total_qty,
            "packed_qty": this.props.poData[key][i].packed_qty,
            "vendor_name": this.props.poData[key][i].vendor_name,
            "outlet_name": this.props.poData[key][i].outlet_name,
            "current_packed_qty": current_packed_qty
          }];
        }
      }
    }
    return poToItem;
  },
  render: function() {
    if (this.props.poData == null) {
      return (
        <div></div>
        );
    }
    var poList = [];
    var item_id = 0;
    // Checking if the dialog has been opened before, then refresh that too.
    if (this.refs.itemListDialog && this.refs.itemListDialog.state.item_id != 0) {
      poList = this.refreshItemDialog(this.refs.itemListDialog.state.item_id);
      item_id = this.refs.itemListDialog.state.item_id;
    }
    var poToItem = this.poToItem();
    var listNodes = Object.keys(poToItem).map(function(key) {
      var allPacked = true;
      // checking whether all the items have been packed for all POs
      for (var i = 0; i < poToItem[key].length; i++) {
        if (poToItem[key][i]["total_qty"] - poToItem[key][i]["packed_qty"] -poToItem[key][i]["current_packed_qty"] > 0) {
          allPacked = false;
          break;
        }
      }
      // If yes, then do not show the item
      if (allPacked) {
        return true;
      }
      var listNodeStyle = {
        margin: '10px'
      }
      var imageStyle = {
        height: '180px'
      }
      var buttonStyle = {
        marginLeft: '100px'
      }
      var imgUrl = HQ_URL + "/food_item/image/" + key;
      return (
        <div key={key} style={listNodeStyle}>
        <img src={imgUrl} style={imageStyle} />
        <button className="btn btn-raised" data-dismiss="modal" onClick={this.openItemDialog.bind(this, key)} style={buttonStyle}>PACK</button>
        </div>
      );
    }, this);
    return (
      <div style={this.props.style}>
        This is an item list !
        {listNodes}
        <ItemListDialog
          ref='itemListDialog'
          poList={poList}
          item_id={item_id}/>
      </div>
    );
  }
});

var ItemListDialog = React.createClass({
  getInitialState: function() {
    return {item_id: this.props.item_id, poList: this.props.poList};
  },
  openPackingScreen: function(po_id, total_qty, packed_qty, event) {
    $("#itemListDialog").modal("hide");
    React.render(<PackingScreen
        item_id={this.state.item_id}
        po_id={po_id}
        total_qty={total_qty}
        packed_qty={packed_qty} />,
      document.getElementById('packing'));
  },
  componentDidUpdate: function(prevProps, prevState) {
    $.material.init();
  },
  render: function() {
    return (
      <div id="itemListDialog" className="modal fade" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Per PO item view</h4>
            </div>
            <div className="modal-body">
              <div style={{fontWeight: 'bold', borderBottom: '1px solid #CCCCCC'}}>
              Item id - {this.state.item_id}
              </div>
              {this.state.poList}
            </div>
            <div className="modal-footer">
              <button className="btn btn-raised" data-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
});
