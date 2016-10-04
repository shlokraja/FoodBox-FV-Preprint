var SettingsDialog = React.createClass({
  saveSettings: function() {
    RESTAURANT_ID = React.findDOMNode(this.refs.rest_id).value;
    simpleStorage.set("RESTAURANT_ID", RESTAURANT_ID);

    HQ_URL = React.findDOMNode(this.refs.hq_url).value
    simpleStorage.set("HQ_URL", HQ_URL);

       SCANNER_URL = React.findDOMNode(this.refs.scanner_url).value
        simpleStorage.set("SCANNER_URL", SCANNER_URL);

    SAFE_ZONE_START = React.findDOMNode(this.refs.safe_zone_start).value
    simpleStorage.set("SAFE_ZONE_START", SAFE_ZONE_START);

    SAFE_ZONE_END = React.findDOMNode(this.refs.safe_zone_end).value
    simpleStorage.set("SAFE_ZONE_END", SAFE_ZONE_END);

    SHOW_SEALING_COMPLETE = $("#sealing_complete").val();
    simpleStorage.set("SHOW_SEALING_COMPLETE", SHOW_SEALING_COMPLETE);
    $("#settingsDialog").modal("hide");

    // Reloading the app
    location.reload();
  },
  componentDidMount: function() {
    // populating the values from the variables
    React.findDOMNode(this.refs.rest_id).value = RESTAURANT_ID;
    React.findDOMNode(this.refs.hq_url).value = HQ_URL;
    React.findDOMNode(this.refs.scanner_url).value = SCANNER_URL;
    React.findDOMNode(this.refs.safe_zone_start).value = SAFE_ZONE_START;
    React.findDOMNode(this.refs.safe_zone_end).value = SAFE_ZONE_END;
    $("#sealing_complete").val(SHOW_SEALING_COMPLETE);
    //React.findDOMNode(this.refs.sealing_complete).selected = SHOW_SEALING_COMPLETE;
    $("#settingsDialog").modal("show");
    $.material.init();
  },
  render: function() {
    return (
      <div id="settingsDialog" className="modal fade" tabIndex="-1">
        <div className="modal-dialog" style={{top: '75px'}}>
          <div className="modal-content">
            <div className="modal-header" style={{padding: '0px',
                                                  paddingTop: '1px',
                                                  textAlign: 'center'}}>
              <h4>Settings Screen</h4>
            </div>
            <div className="modal-body" style={{overflow: 'auto'}}>
              <div className="form-group">
                <label for="rest_id" className="col-lg-5 control-label">Restaurant Id</label>
                <div className="col-lg-5">
                  <input type="text" className="form-control" id="rest_id" ref="rest_id" placeholder="23" />
                </div>
              </div>
              <div className="form-group">
                <label for="hq_url" className="col-lg-5 control-label">HQ URL</label>
                <div className="col-lg-5">
                  <input type="text" className="form-control" id="hq_url" ref="hq_url"  placeholder="http://localhost:8080" />
                </div>
              </div>
            <div className="form-group">
                <label for="scanner_url" className="col-lg-5 control-label">SCANNER URL</label>
                <div className="col-lg-5">
                  <input type="text" className="form-control" id="scanner_url" ref="scanner_url"  placeholder="http://localhost:8080" />
                </div>
              </div>
              <div className="form-group">
                <label for="safe_zone_start" className="col-lg-5 control-label">Safe zone start gap</label>
                <div className="col-lg-5">
                  <input type="number" className="form-control" id="safe_zone_start" ref="safe_zone_start"  placeholder="2.5" step="0.5" min="0" style={{width: '158px', display: 'inline-block'}} /> hours
                </div>
              </div>
              <div className="form-group">
                <label for="safe_zone_end" className="col-lg-5 control-label">Safe zone end gap</label>
                <div className="col-lg-5">
                  <input type="number" className="form-control" id="safe_zone_end" ref="safe_zone_end"  placeholder="0.5" step="0.5" min="0" style={{width: '158px', display: 'inline-block'}} /> hours
                </div>
              </div>
              <div className="form-group">
                <label for="sealing_complete" className="col-lg-5 control-label">Show sealing complete</label>
                <div className="col-lg-5">
                   <select class="form-control" id="sealing_complete" ref="sealing_complete">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-raised btn-info" onClick={this.saveSettings} >Save</button>
              <button className="btn btn-raised" data-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
});
