var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* Tabulator v4.2.6 (c) Oliver Folkerd */

var HtmlTableExport = function HtmlTableExport(table) {
	this.table = table; //hold Tabulator object
	this.config = {};
	this.cloneTableStyle = true;
};

HtmlTableExport.prototype.genereateTable = function (config, style) {

	this.cloneTableStyle = style;
	this.config = config || {};

	var headers = this.generateHeaderElements();
	var body = this.generateBodyElements();

	var table = document.createElement("table");
	table.classList.add("tabulator-print-table");
	table.appendChild(headers);
	table.appendChild(body);

	this.mapElementStyles(this.table.element, table, ["border-top", "border-left", "border-right", "border-bottom"]);

	return table;
};

HtmlTableExport.prototype.generateColumnGroupHeaders = function () {
	var _this = this;

	var output = [];

	var columns = this.config.columnGroups !== false ? this.table.columnManager.columns : this.table.columnManager.columnsByIndex;

	columns.forEach(function (column) {
		var colData = _this.processColumnGroup(column);

		if (colData) {
			output.push(colData);
		}
	});

	return output;
};

HtmlTableExport.prototype.processColumnGroup = function (column) {
	var _this2 = this;

	var subGroups = column.columns,
	    maxDepth = 0;

	var groupData = {
		title: column.definition.title,
		column: column,
		depth: 1
	};

	if (subGroups.length) {
		groupData.subGroups = [];
		groupData.width = 0;

		subGroups.forEach(function (subGroup) {
			var subGroupData = _this2.processColumnGroup(subGroup);

			if (subGroupData) {
				groupData.width += subGroupData.width;
				groupData.subGroups.push(subGroupData);

				if (subGroupData.depth > maxDepth) {
					maxDepth = subGroupData.depth;
				}
			}
		});

		groupData.depth += maxDepth;

		if (!groupData.width) {
			return false;
		}
	} else {
		if (column.field && column.visible) {
			groupData.width = 1;
		} else {
			return false;
		}
	}

	return groupData;
};

HtmlTableExport.prototype.groupHeadersToRows = function (columns) {

	var headers = [],
	    headerDepth = 0;

	function parseColumnGroup(column, level) {

		var depth = headerDepth - level;

		if (typeof headers[level] === "undefined") {
			headers[level] = [];
		}

		column.height = column.subGroups ? 1 : depth - column.depth + 1;

		headers[level].push(column);

		if (column.subGroups) {
			column.subGroups.forEach(function (subGroup) {
				parseColumnGroup(subGroup, level + 1);
			});
		}
	}

	//calculate maximum header debth
	columns.forEach(function (column) {
		if (column.depth > headerDepth) {
			headerDepth = column.depth;
		}
	});

	columns.forEach(function (column) {
		parseColumnGroup(column, 0);
	});

	return headers;
};

HtmlTableExport.prototype.generateHeaderElements = function () {
	var _this3 = this;

	var headerEl = document.createElement("thead");

	var rows = this.groupHeadersToRows(this.generateColumnGroupHeaders());

	rows.forEach(function (row) {
		var rowEl = document.createElement("tr");

		_this3.mapElementStyles(_this3.table.columnManager.getHeadersElement(), headerEl, ["border-top", "border-left", "border-right", "border-bottom", "background-color", "color", "font-weight", "font-family", "font-size"]);

		row.forEach(function (column) {
			var cellEl = document.createElement("th");

			cellEl.colSpan = column.width;
			cellEl.rowSpan = column.height;

			cellEl.innerHTML = column.column.definition.title;

			_this3.mapElementStyles(column.column.getElement(), cellEl, ["text-align", "border-top", "border-left", "border-right", "border-bottom", "background-color", "color", "font-weight", "font-family", "font-size"]);
			_this3.mapElementStyles(column.column.contentElement, cellEl, ["padding-top", "padding-left", "padding-right", "padding-bottom"]);

			if (column.column.parent) {
				_this3.mapElementStyles(column.column.parent.groupElement, cellEl, ["border-top"]);
			}

			rowEl.appendChild(cellEl);
		});

		headerEl.appendChild(rowEl);
	});

	return headerEl;
};

HtmlTableExport.prototype.generateBodyElements = function () {
	var _this4 = this;

	var oddRow, evenRow, calcRow, firstRow, firstCell, firstGroup, lastCell, styleCells, styleRow;

	//lookup row styles
	if (this.cloneTableStyle && window.getComputedStyle) {
		oddRow = this.table.element.querySelector(".tabulator-row-odd:not(.tabulator-group):not(.tabulator-calcs)");
		evenRow = this.table.element.querySelector(".tabulator-row-even:not(.tabulator-group):not(.tabulator-calcs)");
		calcRow = this.table.element.querySelector(".tabulator-row.tabulator-calcs");
		firstRow = this.table.element.querySelector(".tabulator-row:not(.tabulator-group):not(.tabulator-calcs)");
		firstGroup = this.table.element.getElementsByClassName("tabulator-group")[0];

		if (firstRow) {
			styleCells = firstRow.getElementsByClassName("tabulator-cell");
			firstCell = styleCells[0];
			lastCell = styleCells[styleCells.length - 1];
		}
	}

	var bodyEl = document.createElement("tbody");

	var rows = this.table.rowManager.getDisplayRows();
	var columns = this.table.columnManager.columnsByIndex;

	rows = rows.filter(function (row) {
		switch (row.type) {
			case "group":
				return _this4.config.rowGroups !== false;
				break;

			case "calc":
				return _this4.config.columnCalcs !== false;
				break;
		}

		return true;
	});

	rows.forEach(function (row, i) {
		var rowData = row.getData();

		var rowEl = document.createElement("tr");
		rowEl.classList.add("tabulator-print-table-row");

		switch (row.type) {
			case "group":
				var cellEl = document.createElement("td");
				cellEl.colSpan = columns.length;
				cellEl.innerHTML = row.key;

				rowEl.classList.add("tabulator-print-table-group");

				_this4.mapElementStyles(firstGroup, rowEl, ["border-top", "border-left", "border-right", "border-bottom", "color", "font-weight", "font-family", "font-size", "background-color"]);
				_this4.mapElementStyles(firstGroup, cellEl, ["padding-top", "padding-left", "padding-right", "padding-bottom"]);
				rowEl.appendChild(cellEl);
				break;

			case "calc":
				rowEl.classList.add("tabulator-print-table-calcs");

			case "row":
				columns.forEach(function (column) {
					var cellEl = document.createElement("td");

					var value = column.getFieldValue(rowData);

					var cellWrapper = {
						getValue: function getValue() {
							return value;
						},
						getField: function getField() {
							return column.definition.field;
						},
						getElement: function getElement() {
							return cellEl;
						},
						getColumn: function getColumn() {
							return column.getComponent();
						},
						getRow: function getRow() {
							return {
								normalizeHeight: function normalizeHeight() {}
							};
						},
						getComponent: function getComponent() {
							return cellWrapper;
						},
						column: column
					};

					if (_this4.table.modExists("format")) {
						value = _this4.table.modules.format.formatValue(cellWrapper);
					} else {
						switch (typeof value === "undefined" ? "undefined" : _typeof(value)) {
							case "object":
								value = JSON.stringify(value);
								break;

							case "undefined":
							case "null":
								value = "";
								break;

							default:
								value = value;
						}
					}

					if (value instanceof Node) {
						cellEl.appendChild(value);
					} else {
						cellEl.innerHTML = value;
					}

					if (firstCell) {
						_this4.mapElementStyles(firstCell, cellEl, ["padding-top", "padding-left", "padding-right", "padding-bottom", "border-top", "border-left", "border-right", "border-bottom", "color", "font-weight", "font-family", "font-size"]);
					}

					rowEl.appendChild(cellEl);
				});

				styleRow = row.type == "calc" ? calcRow : i % 2 && evenRow ? evenRow : oddRow;

				_this4.mapElementStyles(styleRow, rowEl, ["border-top", "border-left", "border-right", "border-bottom", "color", "font-weight", "font-family", "font-size", "background-color"]);
				break;
		}

		bodyEl.appendChild(rowEl);
	});

	return bodyEl;
};

HtmlTableExport.prototype.getHtml = function (active) {
	var holder = document.createElement("div");

	holder.appendChild(this.genereateTable());

	return holder.innerHTML;
};

HtmlTableExport.prototype.mapElementStyles = function (from, to, props) {
	if (this.cloneTableStyle && from && to) {

		var lookup = {
			"background-color": "backgroundColor",
			"color": "fontColor",
			"font-weight": "fontWeight",
			"font-family": "fontFamily",
			"font-size": "fontSize",
			"text-align": "textAlign",
			"border-top": "borderTop",
			"border-left": "borderLeft",
			"border-right": "borderRight",
			"border-bottom": "borderBottom",
			"padding-top": "paddingTop",
			"padding-left": "paddingLeft",
			"padding-right": "paddingRight",
			"padding-bottom": "paddingBottom"
		};

		if (window.getComputedStyle) {
			var fromStyle = window.getComputedStyle(from);

			props.forEach(function (prop) {
				to.style[lookup[prop]] = fromStyle.getPropertyValue(prop);
			});
		}
	}
};

Tabulator.prototype.registerModule("htmlTableExport", HtmlTableExport);