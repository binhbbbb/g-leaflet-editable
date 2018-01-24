"use strict";(function(factory,window){if(typeof define==="function"&&define.amd){define(["leaflet"],factory)}else if(typeof exports==="object"){module.exports=factory(require("leaflet"))}if(typeof window!=="undefined"&&window.L){factory(window.L)}})(function(L){L.Editable=L.Evented.extend({statics:{FORWARD:1,BACKWARD:-1},options:{zIndex:1e3,polygonClass:L.Polygon,polylineClass:L.Polyline,markerClass:L.Marker,rectangleClass:L.Rectangle,circleClass:L.Circle,drawingCSSClass:"leaflet-editable-drawing",drawingCursor:"crosshair",editLayer:undefined,featuresLayer:undefined,polylineEditorClass:undefined,polygonEditorClass:undefined,markerEditorClass:undefined,rectangleEditorClass:undefined,circleEditorClass:undefined,lineGuideOptions:{},skipMiddleMarkers:false},initialize:function(map,options){L.setOptions(this,options);this._lastZIndex=this.options.zIndex;this.map=map;this.editLayer=this.createEditLayer();this.featuresLayer=this.createFeaturesLayer();this.forwardLineGuide=this.createLineGuide();this.backwardLineGuide=this.createLineGuide()},fireAndForward:function(type,e){e=e||{};e.editTools=this;this.fire(type,e);this.map.fire(type,e)},createLineGuide:function(){var options=L.extend({dashArray:"5,10",weight:1,interactive:false},this.options.lineGuideOptions);return L.polyline([],options)},createVertexIcon:function(options){return L.Browser.touch?new L.Editable.TouchVertexIcon(options):new L.Editable.VertexIcon(options)},createEditLayer:function(){return this.options.editLayer||(new L.LayerGroup).addTo(this.map)},createFeaturesLayer:function(){return this.options.featuresLayer||(new L.LayerGroup).addTo(this.map)},moveForwardLineGuide:function(latlng){if(this.forwardLineGuide._latlngs.length){this.forwardLineGuide._latlngs[1]=latlng;this.forwardLineGuide._bounds.extend(latlng);this.forwardLineGuide.redraw()}},moveBackwardLineGuide:function(latlng){if(this.backwardLineGuide._latlngs.length){this.backwardLineGuide._latlngs[1]=latlng;this.backwardLineGuide._bounds.extend(latlng);this.backwardLineGuide.redraw()}},anchorForwardLineGuide:function(latlng){this.forwardLineGuide._latlngs[0]=latlng;this.forwardLineGuide._bounds.extend(latlng);this.forwardLineGuide.redraw()},anchorBackwardLineGuide:function(latlng){this.backwardLineGuide._latlngs[0]=latlng;this.backwardLineGuide._bounds.extend(latlng);this.backwardLineGuide.redraw()},attachForwardLineGuide:function(){this.editLayer.addLayer(this.forwardLineGuide)},attachBackwardLineGuide:function(){this.editLayer.addLayer(this.backwardLineGuide)},detachForwardLineGuide:function(){this.forwardLineGuide.setLatLngs([]);this.editLayer.removeLayer(this.forwardLineGuide)},detachBackwardLineGuide:function(){this.backwardLineGuide.setLatLngs([]);this.editLayer.removeLayer(this.backwardLineGuide)},blockEvents:function(){if(!this._oldTargets){this._oldTargets=this.map._targets;this.map._targets={}}},unblockEvents:function(){if(this._oldTargets){this.map._targets=L.extend(this.map._targets,this._oldTargets);delete this._oldTargets}},registerForDrawing:function(editor){if(this._drawingEditor)this.unregisterForDrawing(this._drawingEditor);this.blockEvents();editor.reset();this._drawingEditor=editor;this.map.on("mousemove touchmove",editor.onDrawingMouseMove,editor);this.map.on("mousedown",this.onMousedown,this);this.map.on("mouseup",this.onMouseup,this);L.DomUtil.addClass(this.map._container,this.options.drawingCSSClass);this.defaultMapCursor=this.map._container.style.cursor;this.map._container.style.cursor=this.options.drawingCursor},unregisterForDrawing:function(editor){this.unblockEvents();L.DomUtil.removeClass(this.map._container,this.options.drawingCSSClass);this.map._container.style.cursor=this.defaultMapCursor;editor=editor||this._drawingEditor;if(!editor)return;this.map.off("mousemove touchmove",editor.onDrawingMouseMove,editor);this.map.off("mousedown",this.onMousedown,this);this.map.off("mouseup",this.onMouseup,this);if(editor!==this._drawingEditor)return;delete this._drawingEditor;if(editor._drawing)editor.cancelDrawing()},onMousedown:function(e){this._mouseDown=e;this._drawingEditor.onDrawingMouseDown(e)},onMouseup:function(e){if(this._mouseDown){var editor=this._drawingEditor,mouseDown=this._mouseDown;this._mouseDown=null;editor.onDrawingMouseUp(e);if(this._drawingEditor!==editor)return;var origin=L.point(mouseDown.originalEvent.clientX,mouseDown.originalEvent.clientY);var distance=L.point(e.originalEvent.clientX,e.originalEvent.clientY).distanceTo(origin);if(Math.abs(distance)<9*(window.devicePixelRatio||1))this._drawingEditor.onDrawingClick(e)}},drawing:function(){return this._drawingEditor&&this._drawingEditor.drawing()},stopDrawing:function(){this.unregisterForDrawing()},commitDrawing:function(e){if(!this._drawingEditor)return;this._drawingEditor.commitDrawing(e)},connectCreatedToMap:function(layer){return this.featuresLayer.addLayer(layer)},startPolyline:function(latlng,options){var line=this.createPolyline([],options);line.enableEdit(this.map).newShape(latlng);return line},startPolygon:function(latlng,options){var polygon=this.createPolygon([],options);polygon.enableEdit(this.map).newShape(latlng);return polygon},startMarker:function(latlng,options){latlng=latlng||this.map.getCenter().clone();var marker=this.createMarker(latlng,options);marker.enableEdit(this.map).startDrawing();return marker},startRectangle:function(latlng,options){var corner=latlng||L.latLng([0,0]);var bounds=new L.LatLngBounds(corner,corner);var rectangle=this.createRectangle(bounds,options);rectangle.enableEdit(this.map).startDrawing();return rectangle},startCircle:function(latlng,options){latlng=latlng||this.map.getCenter().clone();var circle=this.createCircle(latlng,options);circle.enableEdit(this.map).startDrawing();return circle},startHole:function(editor,latlng){editor.newHole(latlng)},createLayer:function(klass,latlngs,options){options=L.Util.extend({editOptions:{editTools:this}},options);var layer=new klass(latlngs,options);this.fireAndForward("editable:created",{layer:layer});return layer},createPolyline:function(latlngs,options){return this.createLayer(options&&options.polylineClass||this.options.polylineClass,latlngs,options)},createPolygon:function(latlngs,options){return this.createLayer(options&&options.polygonClass||this.options.polygonClass,latlngs,options)},createMarker:function(latlng,options){return this.createLayer(options&&options.markerClass||this.options.markerClass,latlng,options)},createRectangle:function(bounds,options){return this.createLayer(options&&options.rectangleClass||this.options.rectangleClass,bounds,options)},createCircle:function(latlng,options){return this.createLayer(options&&options.circleClass||this.options.circleClass,latlng,options)}});L.extend(L.Editable,{makeCancellable:function(e){e.cancel=function(){e._cancelled=true}}});L.Map.mergeOptions({editToolsClass:L.Editable,editable:false,editOptions:{}});L.Map.addInitHook(function(){this.whenReady(function(){if(this.options.editable){this.editTools=new this.options.editToolsClass(this,this.options.editOptions)}})});L.Editable.VertexIcon=L.DivIcon.extend({options:{iconSize:new L.Point(8,8)}});L.Editable.TouchVertexIcon=L.Editable.VertexIcon.extend({options:{iconSize:new L.Point(20,20)}});L.Editable.VertexMarker=L.Marker.extend({options:{draggable:true,className:"leaflet-div-icon leaflet-vertex-icon"},initialize:function(latlng,latlngs,editor,options){this.latlng=latlng;this.latlngs=latlngs;this.editor=editor;L.Marker.prototype.initialize.call(this,latlng,options);this.options.icon=this.editor.tools.createVertexIcon({className:this.options.className});this.latlng.__vertex=this;this.editor.editLayer.addLayer(this);this.setZIndexOffset(editor.tools._lastZIndex+1)},onAdd:function(map){L.Marker.prototype.onAdd.call(this,map);this.on("drag",this.onDrag);this.on("dragstart",this.onDragStart);this.on("dragend",this.onDragEnd);this.on("mouseup",this.onMouseup);this.on("click",this.onClick);this.on("contextmenu",this.onContextMenu);this.on("mousedown touchstart",this.onMouseDown);this.addMiddleMarkers()},onRemove:function(map){if(this.middleMarker)this.middleMarker.delete();delete this.latlng.__vertex;this.off("drag",this.onDrag);this.off("dragstart",this.onDragStart);this.off("dragend",this.onDragEnd);this.off("mouseup",this.onMouseup);this.off("click",this.onClick);this.off("contextmenu",this.onContextMenu);this.off("mousedown touchstart",this.onMouseDown);L.Marker.prototype.onRemove.call(this,map)},onDrag:function(e){e.vertex=this;this.editor.onVertexMarkerDrag(e);var iconPos=L.DomUtil.getPosition(this._icon),latlng=this._map.layerPointToLatLng(iconPos);this.latlng.update(latlng);this._latlng=this.latlng;this.editor.refresh();if(this.middleMarker)this.middleMarker.updateLatLng();var next=this.getNext();if(next&&next.middleMarker)next.middleMarker.updateLatLng()},onDragStart:function(e){e.vertex=this;this.editor.onVertexMarkerDragStart(e)},onDragEnd:function(e){e.vertex=this;this.editor.onVertexMarkerDragEnd(e)},onClick:function(e){e.vertex=this;this.editor.onVertexMarkerClick(e)},onMouseup:function(e){L.DomEvent.stop(e);e.vertex=this;this.editor.map.fire("mouseup",e)},onContextMenu:function(e){e.vertex=this;this.editor.onVertexMarkerContextMenu(e)},onMouseDown:function(e){e.vertex=this;this.editor.onVertexMarkerMouseDown(e)},delete:function(){var next=this.getNext();this.latlngs.splice(this.getIndex(),1);this.editor.editLayer.removeLayer(this);this.editor.onVertexDeleted({latlng:this.latlng,vertex:this});if(!this.latlngs.length)this.editor.deleteShape(this.latlngs);if(next)next.resetMiddleMarker();this.editor.refresh()},getIndex:function(){return this.latlngs.indexOf(this.latlng)},getLastIndex:function(){return this.latlngs.length-1},getPrevious:function(){if(this.latlngs.length<2)return;var index=this.getIndex(),previousIndex=index-1;if(index===0&&this.editor.CLOSED)previousIndex=this.getLastIndex();var previous=this.latlngs[previousIndex];if(previous)return previous.__vertex},getNext:function(){if(this.latlngs.length<2)return;var index=this.getIndex(),nextIndex=index+1;if(index===this.getLastIndex()&&this.editor.CLOSED)nextIndex=0;var next=this.latlngs[nextIndex];if(next)return next.__vertex},addMiddleMarker:function(previous){if(!this.editor.hasMiddleMarkers())return;previous=previous||this.getPrevious();if(previous&&!this.middleMarker)this.middleMarker=this.editor.addMiddleMarker(previous,this,this.latlngs,this.editor)},addMiddleMarkers:function(){if(!this.editor.hasMiddleMarkers())return;var previous=this.getPrevious();if(previous)this.addMiddleMarker(previous);var next=this.getNext();if(next)next.resetMiddleMarker()},resetMiddleMarker:function(){if(this.middleMarker)this.middleMarker.delete();this.addMiddleMarker()},split:function(){if(!this.editor.splitShape)return;this.editor.splitShape(this.latlngs,this.getIndex())},continue:function(){if(!this.editor.continueBackward)return;var index=this.getIndex();if(index===0)this.editor.continueBackward(this.latlngs);else if(index===this.getLastIndex())this.editor.continueForward(this.latlngs)}});L.Editable.mergeOptions({vertexMarkerClass:L.Editable.VertexMarker});L.Editable.MiddleMarker=L.Marker.extend({options:{opacity:.5,className:"leaflet-div-icon leaflet-middle-icon",draggable:true},initialize:function(left,right,latlngs,editor,options){this.left=left;this.right=right;this.editor=editor;this.latlngs=latlngs;L.Marker.prototype.initialize.call(this,this.computeLatLng(),options);this._opacity=this.options.opacity;this.options.icon=this.editor.tools.createVertexIcon({className:this.options.className});this.editor.editLayer.addLayer(this);this.setVisibility()},setVisibility:function(){var leftPoint=this._map.latLngToContainerPoint(this.left.latlng),rightPoint=this._map.latLngToContainerPoint(this.right.latlng),size=L.point(this.options.icon.options.iconSize);if(leftPoint.distanceTo(rightPoint)<size.x*3)this.hide();else this.show()},show:function(){this.setOpacity(this._opacity)},hide:function(){this.setOpacity(0)},updateLatLng:function(){this.setLatLng(this.computeLatLng());this.setVisibility()},computeLatLng:function(){var leftPoint=this.editor.map.latLngToContainerPoint(this.left.latlng),rightPoint=this.editor.map.latLngToContainerPoint(this.right.latlng),y=(leftPoint.y+rightPoint.y)/2,x=(leftPoint.x+rightPoint.x)/2;return this.editor.map.containerPointToLatLng([x,y])},onAdd:function(map){L.Marker.prototype.onAdd.call(this,map);L.DomEvent.on(this._icon,"mousedown touchstart",this.onMouseDown,this);map.on("zoomend",this.setVisibility,this)},onRemove:function(map){delete this.right.middleMarker;L.DomEvent.off(this._icon,"mousedown touchstart",this.onMouseDown,this);map.off("zoomend",this.setVisibility,this);L.Marker.prototype.onRemove.call(this,map)},onMouseDown:function(e){var iconPos=L.DomUtil.getPosition(this._icon),latlng=this.editor.map.layerPointToLatLng(iconPos);e={originalEvent:e,latlng:latlng};if(this.options.opacity===0)return;L.Editable.makeCancellable(e);this.editor.onMiddleMarkerMouseDown(e);if(e._cancelled)return;this.latlngs.splice(this.index(),0,e.latlng);this.editor.refresh();var icon=this._icon;var marker=this.editor.addVertexMarker(e.latlng,this.latlngs);this.editor.onNewVertex(marker);var parent=marker._icon.parentNode;parent.removeChild(marker._icon);marker._icon=icon;parent.appendChild(marker._icon);marker._initIcon();marker._initInteraction();marker.setOpacity(1);L.Draggable._dragging=false;marker.dragging._draggable._onDown(e.originalEvent);this.delete()},delete:function(){this.editor.editLayer.removeLayer(this)},index:function(){return this.latlngs.indexOf(this.right.latlng)}});L.Editable.mergeOptions({middleMarkerClass:L.Editable.MiddleMarker});L.Editable.BaseEditor=L.Handler.extend({initialize:function(map,feature,options){L.setOptions(this,options);this.map=map;this.feature=feature;this.feature.editor=this;this.editLayer=new L.LayerGroup;this.tools=this.options.editTools||map.editTools},addHooks:function(){if(this.isConnected())this.onFeatureAdd();else this.feature.once("add",this.onFeatureAdd,this);this.onEnable();this.feature.on(this._getEvents(),this)},removeHooks:function(){this.feature.off(this._getEvents(),this);if(this.feature.dragging)this.feature.dragging.disable();this.editLayer.clearLayers();this.tools.editLayer.removeLayer(this.editLayer);this.onDisable();if(this._drawing)this.cancelDrawing()},drawing:function(){return!!this._drawing},reset:function(){},onFeatureAdd:function(){this.tools.editLayer.addLayer(this.editLayer);if(this.feature.dragging)this.feature.dragging.enable()},hasMiddleMarkers:function(){return!this.options.skipMiddleMarkers&&!this.tools.options.skipMiddleMarkers},fireAndForward:function(type,e){e=e||{};e.layer=this.feature;this.feature.fire(type,e);this.tools.fireAndForward(type,e)},onEnable:function(){this.fireAndForward("editable:enable")},onDisable:function(){this.fireAndForward("editable:disable")},onEditing:function(){this.fireAndForward("editable:editing")},onStartDrawing:function(){this.fireAndForward("editable:drawing:start")},onEndDrawing:function(){this.fireAndForward("editable:drawing:end")},onCancelDrawing:function(){this.fireAndForward("editable:drawing:cancel")},onCommitDrawing:function(e){this.fireAndForward("editable:drawing:commit",e)},onDrawingMouseDown:function(e){this.fireAndForward("editable:drawing:mousedown",e)},onDrawingMouseUp:function(e){this.fireAndForward("editable:drawing:mouseup",e)},startDrawing:function(){if(!this._drawing)this._drawing=L.Editable.FORWARD;this.tools.registerForDrawing(this);this.onStartDrawing()},commitDrawing:function(e){this.onCommitDrawing(e);this.endDrawing()},cancelDrawing:function(){L.Draggable._dragging=false;this.onCancelDrawing();this.endDrawing()},endDrawing:function(){this._drawing=false;this.tools.unregisterForDrawing(this);this.onEndDrawing()},onDrawingClick:function(e){if(!this.drawing())return;L.Editable.makeCancellable(e);this.fireAndForward("editable:drawing:click",e);if(e._cancelled)return;if(!this.isConnected())this.connect(e);this.processDrawingClick(e)},isConnected:function(){return this.map.hasLayer(this.feature)},connect:function(){this.tools.connectCreatedToMap(this.feature);this.tools.editLayer.addLayer(this.editLayer)},onMove:function(e){this.fireAndForward("editable:drawing:move",e)},onDrawingMouseMove:function(e){this.onMove(e)},_getEvents:function(){return{dragstart:this.onDragStart,drag:this.onDrag,dragend:this.onDragEnd,remove:this.disable}},onDragStart:function(e){this.onEditing();this.fireAndForward("editable:dragstart",e)},onDrag:function(e){this.onMove(e);this.fireAndForward("editable:drag",e)},onDragEnd:function(e){this.fireAndForward("editable:dragend",e)}});L.Editable.MarkerEditor=L.Editable.BaseEditor.extend({onDrawingMouseMove:function(e){L.Editable.BaseEditor.prototype.onDrawingMouseMove.call(this,e);if(this._drawing)this.feature.setLatLng(e.latlng)},processDrawingClick:function(e){this.fireAndForward("editable:drawing:clicked",e);this.commitDrawing(e)},connect:function(e){if(e)this.feature._latlng=e.latlng;L.Editable.BaseEditor.prototype.connect.call(this,e)}});L.Editable.PathEditor=L.Editable.BaseEditor.extend({CLOSED:false,MIN_VERTEX:2,addHooks:function(){L.Editable.BaseEditor.prototype.addHooks.call(this);if(this.feature)this.initVertexMarkers();return this},initVertexMarkers:function(latlngs){if(!this.enabled())return;latlngs=latlngs||this.getLatLngs();if(isFlat(latlngs))this.addVertexMarkers(latlngs);else for(var i=0;i<latlngs.length;i++)this.initVertexMarkers(latlngs[i])},getLatLngs:function(){return this.feature.getLatLngs()},reset:function(){this.editLayer.clearLayers();this.initVertexMarkers()},addVertexMarker:function(latlng,latlngs){return new this.tools.options.vertexMarkerClass(latlng,latlngs,this)},onNewVertex:function(vertex){this.fireAndForward("editable:vertex:new",{latlng:vertex.latlng,vertex:vertex})},addVertexMarkers:function(latlngs){for(var i=0;i<latlngs.length;i++){this.addVertexMarker(latlngs[i],latlngs)}},refreshVertexMarkers:function(latlngs){latlngs=latlngs||this.getDefaultLatLngs();for(var i=0;i<latlngs.length;i++){latlngs[i].__vertex.update()}},addMiddleMarker:function(left,right,latlngs){return new this.tools.options.middleMarkerClass(left,right,latlngs,this)},onVertexMarkerClick:function(e){L.Editable.makeCancellable(e);this.fireAndForward("editable:vertex:click",e);if(e._cancelled)return;if(this.tools.drawing()&&this.tools._drawingEditor!==this)return;var index=e.vertex.getIndex(),commit;if(e.originalEvent.ctrlKey){this.onVertexMarkerCtrlClick(e)}else if(e.originalEvent.altKey){this.onVertexMarkerAltClick(e)}else if(e.originalEvent.shiftKey){this.onVertexMarkerShiftClick(e)}else if(e.originalEvent.metaKey){this.onVertexMarkerMetaKeyClick(e)}else if(index===e.vertex.getLastIndex()&&this._drawing===L.Editable.FORWARD){if(index>=this.MIN_VERTEX-1)commit=true}else if(index===0&&this._drawing===L.Editable.BACKWARD&&this._drawnLatLngs.length>=this.MIN_VERTEX){commit=true}else if(index===0&&this._drawing===L.Editable.FORWARD&&this._drawnLatLngs.length>=this.MIN_VERTEX&&this.CLOSED){commit=true}else{this.onVertexRawMarkerClick(e)}this.fireAndForward("editable:vertex:clicked",e);if(commit)this.commitDrawing(e)},onVertexRawMarkerClick:function(e){this.fireAndForward("editable:vertex:rawclick",e);if(e._cancelled)return;if(!this.vertexCanBeDeleted(e.vertex))return;e.vertex.delete()},vertexCanBeDeleted:function(vertex){return vertex.latlngs.length>this.MIN_VERTEX},onVertexDeleted:function(e){this.fireAndForward("editable:vertex:deleted",e)},onVertexMarkerCtrlClick:function(e){this.fireAndForward("editable:vertex:ctrlclick",e)},onVertexMarkerShiftClick:function(e){this.fireAndForward("editable:vertex:shiftclick",e)},onVertexMarkerMetaKeyClick:function(e){this.fireAndForward("editable:vertex:metakeyclick",e)},onVertexMarkerAltClick:function(e){this.fireAndForward("editable:vertex:altclick",e)},onVertexMarkerContextMenu:function(e){this.fireAndForward("editable:vertex:contextmenu",e)},onVertexMarkerMouseDown:function(e){this.fireAndForward("editable:vertex:mousedown",e)},onMiddleMarkerMouseDown:function(e){this.fireAndForward("editable:middlemarker:mousedown",e)},onVertexMarkerDrag:function(e){this.onMove(e);if(this.feature._bounds)this.extendBounds(e);this.fireAndForward("editable:vertex:drag",e)},onVertexMarkerDragStart:function(e){this.fireAndForward("editable:vertex:dragstart",e)},onVertexMarkerDragEnd:function(e){this.fireAndForward("editable:vertex:dragend",e)},setDrawnLatLngs:function(latlngs){this._drawnLatLngs=latlngs||this.getDefaultLatLngs()},startDrawing:function(){if(!this._drawnLatLngs)this.setDrawnLatLngs();L.Editable.BaseEditor.prototype.startDrawing.call(this)},startDrawingForward:function(){this.startDrawing()},endDrawing:function(){this.tools.detachForwardLineGuide();this.tools.detachBackwardLineGuide();if(this._drawnLatLngs&&this._drawnLatLngs.length<this.MIN_VERTEX)this.deleteShape(this._drawnLatLngs);L.Editable.BaseEditor.prototype.endDrawing.call(this);delete this._drawnLatLngs},addLatLng:function(latlng){if(this._drawing===L.Editable.FORWARD)this._drawnLatLngs.push(latlng);else this._drawnLatLngs.unshift(latlng);this.feature._bounds.extend(latlng);var vertex=this.addVertexMarker(latlng,this._drawnLatLngs);this.onNewVertex(vertex);this.refresh()},newPointForward:function(latlng){this.addLatLng(latlng);this.tools.attachForwardLineGuide();this.tools.anchorForwardLineGuide(latlng)},newPointBackward:function(latlng){this.addLatLng(latlng);this.tools.anchorBackwardLineGuide(latlng)},push:function(latlng){if(!latlng)return console.error("L.Editable.PathEditor.push expect a valid latlng as parameter");if(this._drawing===L.Editable.FORWARD)this.newPointForward(latlng);else this.newPointBackward(latlng)},removeLatLng:function(latlng){latlng.__vertex.delete();this.refresh()},pop:function(){if(this._drawnLatLngs.length<=1)return;var latlng;if(this._drawing===L.Editable.FORWARD)latlng=this._drawnLatLngs[this._drawnLatLngs.length-1];else latlng=this._drawnLatLngs[0];this.removeLatLng(latlng);if(this._drawing===L.Editable.FORWARD)this.tools.anchorForwardLineGuide(this._drawnLatLngs[this._drawnLatLngs.length-1]);else this.tools.anchorForwardLineGuide(this._drawnLatLngs[0]);return latlng},processDrawingClick:function(e){if(e.vertex&&e.vertex.editor===this)return;if(this._drawing===L.Editable.FORWARD)this.newPointForward(e.latlng);else this.newPointBackward(e.latlng);this.fireAndForward("editable:drawing:clicked",e)},onDrawingMouseMove:function(e){L.Editable.BaseEditor.prototype.onDrawingMouseMove.call(this,e);if(this._drawing){this.tools.moveForwardLineGuide(e.latlng);this.tools.moveBackwardLineGuide(e.latlng)}},refresh:function(){this.feature.redraw();this.onEditing()},newShape:function(latlng){var shape=this.addNewEmptyShape();if(!shape)return;this.setDrawnLatLngs(shape[0]||shape);this.startDrawingForward();this.fireAndForward("editable:shape:new",{shape:shape});if(latlng)this.newPointForward(latlng)},deleteShape:function(shape,latlngs){var e={shape:shape};L.Editable.makeCancellable(e);this.fireAndForward("editable:shape:delete",e);if(e._cancelled)return;shape=this._deleteShape(shape,latlngs);if(this.ensureNotFlat)this.ensureNotFlat();this.feature.setLatLngs(this.getLatLngs());this.refresh();this.reset();this.fireAndForward("editable:shape:deleted",{shape:shape});return shape},_deleteShape:function(shape,latlngs){latlngs=latlngs||this.getLatLngs();if(!latlngs.length)return;var self=this,inplaceDelete=function(latlngs,shape){shape=latlngs.splice(0,Number.MAX_VALUE);return shape},spliceDelete=function(latlngs,shape){latlngs.splice(latlngs.indexOf(shape),1);if(!latlngs.length)self._deleteShape(latlngs);return shape};if(latlngs===shape)return inplaceDelete(latlngs,shape);for(var i=0;i<latlngs.length;i++){if(latlngs[i]===shape)return spliceDelete(latlngs,shape);else if(latlngs[i].indexOf(shape)!==-1)return spliceDelete(latlngs[i],shape)}},deleteShapeAt:function(latlng){var shape=this.feature.shapeAt(latlng);if(shape)return this.deleteShape(shape)},appendShape:function(shape){this.insertShape(shape)},prependShape:function(shape){this.insertShape(shape,0)},insertShape:function(shape,index){this.ensureMulti();shape=this.formatShape(shape);if(typeof index==="undefined")index=this.feature._latlngs.length;this.feature._latlngs.splice(index,0,shape);this.feature.redraw();if(this._enabled)this.reset()},extendBounds:function(e){this.feature._bounds.extend(e.vertex.latlng)},onDragStart:function(e){this.editLayer.clearLayers();L.Editable.BaseEditor.prototype.onDragStart.call(this,e)},onDragEnd:function(e){this.initVertexMarkers();L.Editable.BaseEditor.prototype.onDragEnd.call(this,e)}});L.Editable.PolylineEditor=L.Editable.PathEditor.extend({startDrawingBackward:function(){this._drawing=L.Editable.BACKWARD;this.startDrawing()},continueBackward:function(latlngs){if(this.drawing())return;latlngs=latlngs||this.getDefaultLatLngs();this.setDrawnLatLngs(latlngs);if(latlngs.length>0){this.tools.attachBackwardLineGuide();this.tools.anchorBackwardLineGuide(latlngs[0])}this.startDrawingBackward()},continueForward:function(latlngs){if(this.drawing())return;latlngs=latlngs||this.getDefaultLatLngs();this.setDrawnLatLngs(latlngs);if(latlngs.length>0){this.tools.attachForwardLineGuide();this.tools.anchorForwardLineGuide(latlngs[latlngs.length-1])}this.startDrawingForward()},getDefaultLatLngs:function(latlngs){latlngs=latlngs||this.feature._latlngs;if(!latlngs.length||latlngs[0]instanceof L.LatLng)return latlngs;else return this.getDefaultLatLngs(latlngs[0])},ensureMulti:function(){if(this.feature._latlngs.length&&isFlat(this.feature._latlngs)){this.feature._latlngs=[this.feature._latlngs]}},addNewEmptyShape:function(){if(this.feature._latlngs.length){var shape=[];this.appendShape(shape);return shape}else{return this.feature._latlngs}},formatShape:function(shape){if(isFlat(shape))return shape;else if(shape[0])return this.formatShape(shape[0])},splitShape:function(shape,index){if(!index||index>=shape.length-1)return;this.ensureMulti();var shapeIndex=this.feature._latlngs.indexOf(shape);if(shapeIndex===-1)return;var first=shape.slice(0,index+1),second=shape.slice(index);second[0]=L.latLng(second[0].lat,second[0].lng,second[0].alt);this.feature._latlngs.splice(shapeIndex,1,first,second);this.refresh();this.reset()}});L.Editable.PolygonEditor=L.Editable.PathEditor.extend({CLOSED:true,MIN_VERTEX:3,newPointForward:function(latlng){L.Editable.PathEditor.prototype.newPointForward.call(this,latlng);if(!this.tools.backwardLineGuide._latlngs.length)this.tools.anchorBackwardLineGuide(latlng);if(this._drawnLatLngs.length===2)this.tools.attachBackwardLineGuide()},addNewEmptyHole:function(latlng){this.ensureNotFlat();var latlngs=this.feature.shapeAt(latlng);if(!latlngs)return;var holes=[];latlngs.push(holes);return holes},newHole:function(latlng){var holes=this.addNewEmptyHole(latlng);if(!holes)return;this.setDrawnLatLngs(holes);this.startDrawingForward();if(latlng)this.newPointForward(latlng)},addNewEmptyShape:function(){if(this.feature._latlngs.length&&this.feature._latlngs[0].length){var shape=[];this.appendShape(shape);return shape}else{return this.feature._latlngs}},ensureMulti:function(){if(this.feature._latlngs.length&&isFlat(this.feature._latlngs[0])){this.feature._latlngs=[this.feature._latlngs]}},ensureNotFlat:function(){if(!this.feature._latlngs.length||isFlat(this.feature._latlngs))this.feature._latlngs=[this.feature._latlngs]},vertexCanBeDeleted:function(vertex){var parent=this.feature.parentShape(vertex.latlngs),idx=L.Util.indexOf(parent,vertex.latlngs);if(idx>0)return true;return L.Editable.PathEditor.prototype.vertexCanBeDeleted.call(this,vertex)},getDefaultLatLngs:function(){if(!this.feature._latlngs.length)this.feature._latlngs.push([]);return this.feature._latlngs[0]},formatShape:function(shape){if(isFlat(shape)&&(!shape[0]||shape[0].length!==0))return[shape];else return shape}});L.Editable.RectangleEditor=L.Editable.PathEditor.extend({CLOSED:true,MIN_VERTEX:4,options:{skipMiddleMarkers:true},extendBounds:function(e){var index=e.vertex.getIndex(),next=e.vertex.getNext(),previous=e.vertex.getPrevious(),oppositeIndex=(index+2)%4,opposite=e.vertex.latlngs[oppositeIndex],bounds=new L.LatLngBounds(e.latlng,opposite);previous.latlng.update([e.latlng.lat,opposite.lng]);next.latlng.update([opposite.lat,e.latlng.lng]);this.updateBounds(bounds);this.refreshVertexMarkers()},onDrawingMouseDown:function(e){L.Editable.PathEditor.prototype.onDrawingMouseDown.call(this,e);this.connect();var latlngs=this.getDefaultLatLngs();if(latlngs.length===3)latlngs.push(e.latlng);var bounds=new L.LatLngBounds(e.latlng,e.latlng);this.updateBounds(bounds);this.updateLatLngs(bounds);this.refresh();this.reset();e.originalEvent._simulated=false;this.map.dragging._draggable._onUp(e.originalEvent);latlngs[3].__vertex.dragging._draggable._onDown(e.originalEvent)},onDrawingMouseUp:function(e){this.commitDrawing(e);e.originalEvent._simulated=false;L.Editable.PathEditor.prototype.onDrawingMouseUp.call(this,e)},onDrawingMouseMove:function(e){e.originalEvent._simulated=false;L.Editable.PathEditor.prototype.onDrawingMouseMove.call(this,e)},getDefaultLatLngs:function(latlngs){return latlngs||this.feature._latlngs[0]},updateBounds:function(bounds){this.feature._bounds=bounds},updateLatLngs:function(bounds){var latlngs=this.getDefaultLatLngs(),newLatlngs=this.feature._boundsToLatLngs(bounds);for(var i=0;i<latlngs.length;i++){latlngs[i].update(newLatlngs[i])}}});L.Editable.CircleEditor=L.Editable.PathEditor.extend({MIN_VERTEX:2,options:{skipMiddleMarkers:true},initialize:function(map,feature,options){L.Editable.PathEditor.prototype.initialize.call(this,map,feature,options);this._resizeLatLng=this.computeResizeLatLng()},computeResizeLatLng:function(){var delta=(this.feature._radius||this.feature._mRadius)*Math.cos(Math.PI/4),point=this.map.project(this.feature._latlng);return this.map.unproject([point.x+delta,point.y-delta])},updateResizeLatLng:function(){this._resizeLatLng.update(this.computeResizeLatLng());this._resizeLatLng.__vertex.update()},getLatLngs:function(){return[this.feature._latlng,this._resizeLatLng]},getDefaultLatLngs:function(){return this.getLatLngs()},onVertexMarkerDrag:function(e){if(e.vertex.getIndex()===1)this.resize(e);else this.updateResizeLatLng(e);L.Editable.PathEditor.prototype.onVertexMarkerDrag.call(this,e)},resize:function(e){var radius=this.feature._latlng.distanceTo(e.latlng);this.feature.setRadius(radius)},onDrawingMouseDown:function(e){L.Editable.PathEditor.prototype.onDrawingMouseDown.call(this,e);this._resizeLatLng.update(e.latlng);this.feature._latlng.update(e.latlng);this.connect();e.originalEvent._simulated=false;this.map.dragging._draggable._onUp(e.originalEvent);this._resizeLatLng.__vertex.dragging._draggable._onDown(e.originalEvent)},onDrawingMouseUp:function(e){this.commitDrawing(e);e.originalEvent._simulated=false;L.Editable.PathEditor.prototype.onDrawingMouseUp.call(this,e)},onDrawingMouseMove:function(e){e.originalEvent._simulated=false;L.Editable.PathEditor.prototype.onDrawingMouseMove.call(this,e)},onDrag:function(e){L.Editable.PathEditor.prototype.onDrag.call(this,e);this.feature.dragging.updateLatLng(this._resizeLatLng)}});var EditableMixin={createEditor:function(map){map=map||this._map;var tools=(this.options.editOptions||{}).editTools||map.editTools;if(!tools)throw Error("Unable to detect Editable instance.");var Klass=this.options.editorClass||this.getEditorClass(tools);return new Klass(map,this,this.options.editOptions)},enableEdit:function(map){if(!this.editor)this.createEditor(map);this.editor.enable();return this.editor},editEnabled:function(){return this.editor&&this.editor.enabled()},disableEdit:function(){if(this.editor){this.editor.disable();delete this.editor}},toggleEdit:function(){if(this.editEnabled())this.disableEdit();else this.enableEdit()},_onEditableAdd:function(){if(this.editor)this.enableEdit()}};var PolylineMixin={getEditorClass:function(tools){return tools&&tools.options.polylineEditorClass?tools.options.polylineEditorClass:L.Editable.PolylineEditor},shapeAt:function(latlng,latlngs){var shape=null;latlngs=latlngs||this._latlngs;if(!latlngs.length)return shape;else if(isFlat(latlngs)&&this.isInLatLngs(latlng,latlngs))shape=latlngs;else for(var i=0;i<latlngs.length;i++)if(this.isInLatLngs(latlng,latlngs[i]))return latlngs[i];return shape},isInLatLngs:function(l,latlngs){if(!latlngs)return false;var i,k,len,part=[],p,w=this._clickTolerance();this._projectLatlngs(latlngs,part,this._pxBounds);part=part[0];p=this._map.latLngToLayerPoint(l);if(!this._pxBounds.contains(p)){return false}for(i=1,len=part.length,k=0;i<len;k=i++){if(L.LineUtil.pointToSegmentDistance(p,part[k],part[i])<=w){return true}}return false}};var PolygonMixin={getEditorClass:function(tools){return tools&&tools.options.polygonEditorClass?tools.options.polygonEditorClass:L.Editable.PolygonEditor},shapeAt:function(latlng,latlngs){var shape=null;latlngs=latlngs||this._latlngs;if(!latlngs.length)return shape;else if(isFlat(latlngs)&&this.isInLatLngs(latlng,latlngs))shape=latlngs;else if(isFlat(latlngs[0])&&this.isInLatLngs(latlng,latlngs[0]))shape=latlngs;else for(var i=0;i<latlngs.length;i++)if(this.isInLatLngs(latlng,latlngs[i][0]))return latlngs[i];return shape},isInLatLngs:function(l,latlngs){var inside=false,l1,l2,j,k,len2;for(j=0,len2=latlngs.length,k=len2-1;j<len2;k=j++){l1=latlngs[j];l2=latlngs[k];if(l1.lat>l.lat!==l2.lat>l.lat&&l.lng<(l2.lng-l1.lng)*(l.lat-l1.lat)/(l2.lat-l1.lat)+l1.lng){inside=!inside}}return inside},parentShape:function(shape,latlngs){latlngs=latlngs||this._latlngs;if(!latlngs)return;var idx=L.Util.indexOf(latlngs,shape);if(idx!==-1)return latlngs;for(var i=0;i<latlngs.length;i++){idx=L.Util.indexOf(latlngs[i],shape);if(idx!==-1)return latlngs[i]}}};var MarkerMixin={getEditorClass:function(tools){return tools&&tools.options.markerEditorClass?tools.options.markerEditorClass:L.Editable.MarkerEditor}};var RectangleMixin={getEditorClass:function(tools){return tools&&tools.options.rectangleEditorClass?tools.options.rectangleEditorClass:L.Editable.RectangleEditor}};var CircleMixin={getEditorClass:function(tools){return tools&&tools.options.circleEditorClass?tools.options.circleEditorClass:L.Editable.CircleEditor}};var keepEditable=function(){this.on("add",this._onEditableAdd)};var isFlat=L.LineUtil.isFlat||L.LineUtil._flat||L.Polyline._flat;if(L.Polyline){L.Polyline.include(EditableMixin);L.Polyline.include(PolylineMixin);L.Polyline.addInitHook(keepEditable)}if(L.Polygon){L.Polygon.include(EditableMixin);L.Polygon.include(PolygonMixin)}if(L.Marker){L.Marker.include(EditableMixin);L.Marker.include(MarkerMixin);L.Marker.addInitHook(keepEditable)}if(L.Rectangle){L.Rectangle.include(EditableMixin);L.Rectangle.include(RectangleMixin)}if(L.Circle){L.Circle.include(EditableMixin);L.Circle.include(CircleMixin)}L.LatLng.prototype.update=function(latlng){latlng=L.latLng(latlng);this.lat=latlng.lat;this.lng=latlng.lng}},window);
