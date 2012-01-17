Ext.ns('Ext.ux.grid');
/**
 * @author Shea Frederick - http://www.vinylfox.com
 * @class Ext.ux.grid.DataDrag
 * @extends Ext.AbstractPlugin
 *
 * <p>A plugin that allows data to be dragged out of a grid from spreadsheet applications (tabular data).</p>
 * <p>Requires the MouseEventForwarding.js file which adds mouse event forwarding capability to ExtJS</p>
 * <p>Sample Usage</p>
 * <pre><code>
 {
     xtype: 'grid',
     ...,
     plugins: [{ptype:'datadrag'}],
     ...
 }
 * </code></pre>
 * 
 * @alias plugin.datadrag
 * @ptype datadrag
 */
Ext.define('Ext.ux.grid.DataDrag', {
    extend: 'Ext.util.Observable',
    alias: 'plugin.datadrag',
    
    init: function(cmp) {
        this.cmp = cmp;
        this.view = this.cmp.view;
        this.store = this.cmp.store;
        this.view.on('viewready',this.onViewRender,this,{defer:200});
    },
    
    onViewRender: function(){
        var v = this.view;
        if (v.el) {
            v.el.on('click', function(e){
                e.preventDefault();
            }, this, {
                delegate: 'A'
            });
            this.id = Ext.id();
            this.tableCmp = this.createTableEl(v);
            this.tableCmp.container.setOpacity(0.001);
            this.tableCmp.container.forwardMouseEvents();
            this.updateTableRows(this.store, this.store.data.items);
            this.mouseUp = true;
            this.store.on('datachanged', this.updateTableRows, this);
            this.cmp.selModel.on('selectionchange', this.selectElement, this, {delay:50});
            this.cmp.selModel.on('selectionchange', function(){
                if (this.mouseUp){
                    this.updateTableRows();
                }
            }, this, {delay: 1000});
            this.tableCmp.container.on('mouseup', function(){
                this.mouseUp = true;
                this.updateTableRows();
            }, this, {delay:50});
            this.resizeDragArea();
            this.selectElement();
        }
    },
    
    // select text in an element so it can be copied or dragged.
    selectElement: function(){
        var body = document.body, range, sel, el = this.tableCmp.getEl().dom;
        if (body.createTextRange) {
            range = body.createTextRange();
            range.moveToElementText(el);
            range.select();
        } else if (document.createRange && window.getSelection) {
            range = document.createRange();
            range.selectNodeContents(el);
            sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    },
    
    // creates the table element that is used to copy data to excel.
    createTableEl: function(v){
        var tbl = Ext.DomHelper.insertAfter(v.el, {
            id: this.id+'-table',
            style: {
                'font-size': '17px',
                border: '0px none',
                color: '#fff',
                position: 'absolute',
                top: '0px',
                left: '0px',
                'background-color': '#fff',
                margin: 0,
                cursor: 'default'
            }
        }, true);
        tbl.on('click', function(e){
            e.preventDefault();
        }, this, {
            delegate: 'A'
        });
        var tblCmp = Ext.create('Ext.container.Container', {
            renderTo: tbl,
            layout: {
                type: 'table',
                columns: this.getColumns().length
            }
        });
        return tblCmp;
    },
    
    // sync the data in the grid with what is in the table that is copied to excel.
    updateTableRows: function(store, recs, opts){
        var gt = this.tableCmp, rows = [], cols = this.getColumns(), records;
        gt.removeAll();
        if (Ext.isArray(recs)){
            records = recs;
        }else{
            if (this.cmp.selModel.hasSelection()){
                records = this.cmp.selModel.getSelection();
            }else{
                records = this.store.data.items;
            }
        }
        Ext.each(records, function(rec){
            Ext.each(rec.raw, function(col, i){
                if (cols[i]){
                    if (Ext.isFunction(cols[i].dragRenderer)){
                        col = cols[i].dragRenderer(col, undefined, rec);
                    }
                    rows.push({
                        xtype: 'component',
                        autoEl: {
                            tag: 'div',
                            html: col+'',
                            style: 'color: #000;font-size:10pt;',
                            width: cols[i].getWidth()
                        }
                    });
                }else{
                    rows.push({
                        xtype: 'component',
                        autoEl: {
                            tag: 'div',
                            style: 'color: #000;font-size:10pt;',
                            html: ''
                        }
                    });
                }
            });
        }, this);
        gt.add(rows);
        this.resizeDragArea();
        Ext.defer(this.selectElement,100,this);
    },
    
    // get the columns from the grid for use in creating the table that is used for copying to excel.
    getColumns: function(){
        var cols = [];
        this.cmp.headerCt.items.each(function(item){
            if (item.dataIndex){
                cols.push(item);
            }
        }, this);
        return cols;
    },
    
    //  on GridPanel resize, keep the table height correct to cover grid view area.
    resizeDragArea: function(){
        if (this.tableCmp) {
            var v = this.view,
                sc = v.el,
                scs = sc.getSize(),
                s = {
                    width: scs.width - 18,
                    height: scs.height
                };
            this.tableCmp.getEl().child('table').setSize(s);
        }
    }
});

