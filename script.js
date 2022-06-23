let importModal, exportModal, htmlModal;

let tableRowStart =
    '<tr class="sortable"><td class="drag"><a href="#"><i class="bi bi-grip-horizontal"></i><a/></div>';
let tableColumnInput =
    '<td><input type="text" value="%s" style="width: 250px;" class="form-control"/></td>';

(function ($) {
    hljs.highlightAll();

    importModal = new bootstrap.Modal(document.getElementById("import-modal"), {
        keyboard: false
    });

    exportModal = new bootstrap.Modal(document.getElementById("export-modal"), {
        keyboard: false
    });

    htmlModal = new bootstrap.Modal(document.getElementById("html-modal"), {
        keyboard: false
    });

    //define default table
    let table = '[{"0":"Specification"},{"0":"Dimensions","1":"1000mm x 1430mm"}]';

    //generate default table
    generateTable(table);

    //reset table
    $(".table-builder .clear-table").click(function () {
        generateTable('[{"0":"","1":""}]');
    });

    //add row
    $(".table-builder .add-row").click(function () {
        addRow();
    });

    //add column
    $(".table-builder .add-column").click(function () {
        addColumn();
    });

    //show html modal
    $(".table-builder .html-modal").click(function () {
        htmlModal.show();
    });

    //Delete Row
    $(document).on("click", ".delete-row", function () {
        if (countRows() <= 1) return;
        $(this).closest("tr").remove();
    });

    //delete column
    $(document).on("click", ".delete-column", function () {
        var index = $(this).parent().index();
        deleteColumn(index);
    });

    $(".table-builder .import-modal").click(function () {
        importModal.show();
    });

    $(".modal .import-html").click(function () {
        importHtmlToJson();
    });

    //
    $(".modal .import-json").click(function () {
        generateImportedTable();
    });

    $(".table-builder .export-modal").click(function () {
        let json = [];
        let inc = 0;
        $(".table-builder tbody tr").each(function (row_key, row) {
            var obj = {};
            $(row)
                .children("td")
                .each(function (col_key, col) {
                    if ($(col).children("input").length) {
                        var value = $(this).children("input").val();
                        if (value.length > 0) {
                            obj[inc] = value;
                        }
                        inc++;
                    }
                });
            inc = 0;
            json.push(obj);
        });
        exportModal.show();
        $("#export-modal textarea").val(JSON.stringify(json));
        $("#export-modal textarea").focus().select();
    });

    $(".table-builder .export-json").click(function () {
        $("#export-modal textarea").val("");
        exportModal.hide();
    });

    function findLargestRowCount(json) {
        let count = 0;
        $.each(json, function (row_key, row) {
            var num = Object.keys(row).length;
            count = num > count ? num : count;
        });
        return count;
    }

    function generateTable(table) {
        var tableHtml = "";

        var jsonTable = JSON.parse(table);

        var maxColumns = findLargestRowCount(jsonTable);

        $.each(jsonTable, function (key, value) {
            tableHtml += tableRowStart;
            var i = 0;
            $.each(value, function (key, value) {
                tableHtml += tableColumnInput.replace("%s", value);
                i++;
            });
            if (i < maxColumns) {
                for (i; i < maxColumns; i++) {
                    tableHtml += tableColumnInput.replace("%s", "");
                }
            }
            tableHtml += "</tr>";
        });
        $(".table-builder table tbody").html(tableHtml);
        addDeleteButtons();

        initSortable();
    }

    function addRow() {
        let newRow = tableRowStart;
        for (let i = 0; i < countColumns() - 1; i++) {
            newRow += tableColumnInput.replace("%s", "");
        }
        newRow += "</tr>";
        $(".table-builder table tbody").append(newRow);
        addDeleteButtons();
    }

    function addColumn() {
        $(".table-builder table tbody tr").each(function (key) {
            $(this).append(tableColumnInput.replace("%s", ""));
        });
        $(".table-builder .add-row").removeClass("disabled");
        addDeleteButtons();
    }

    function addDeleteButtons() {
        // Delete Row
        $(".table-builder table tbody .ignore").remove();
        var maxColumns = 0;
        var i = 0;
        $(".table-builder table tbody tr").each(function (key, value) {
            $(this).append(
                '<td class="ignore"><button class="text-nowrap btn btn-danger btn-block delete-row"><i class="bi bi-x-lg"></i></button>'
            );
        });

        // Delete Column
        let newRow = '<tr class="ignore"><td></td>';
        for (let i = 0; i < countColumns() - 1; i++) {
            newRow +=
                '<td class="ignore"><button class="text-nowrap btn btn-danger btn-block delete-column" data-index="' +
                i +
                '"><i class="bi bi-x-lg"></i> Column</button></td>';
        }
        newRow += "</tr>";
        $(".table-builder table tfoot").html(newRow);
    }

    function deleteColumn(index) {
        if (countColumns() <= 2) return;
        $(".table-builder table tr").each(function (key, value) {
            $(this).children("td").eq(index).remove();
        });
    }

    function countRows() {
        // console.log("Rows: "+ $(".table-builder table tbody tr").length)
        return $(".table-builder table tbody tr").length ?? 0;
    }

    function countColumns() {
        // console.log("Columns: "+ $(".table-builder table tbody tr:first-child td").length - 1)
        return $(".table-builder table tbody tr:first-child td").length - 1 ?? 0;
    }

    function generateImportedTable() {
        let json = $("#import-modal textarea");
        let content = json.val();

        try {
            JSON.parse(content);
        } catch (e) {
            $(json).before('<div class="alert alert-danger">Invalid JSON Data</div>');
            return;
        }
        $("#import-modal").find(".alert").remove();

        generateTable(content);
        importModal.hide();
        json.val("");
    }

    function importHtmlToJson() {
        let html = $("#html-modal textarea").val();
        let strippedHtml = striptags(html, "table", "tr", "td");
        var json = [];

        $(strippedHtml)
            .find("tr")
            .each(function (row_key, row) {
                var x = 0;
                var obj = {};
                $(row)
                    .find("td")
                    .each(function (col_key, col) {
                        obj[x++] = $(col).text();
                    });
                json.push(obj);
            });
        var table = JSON.stringify(json);
        generateTable(table)

        $("#html-modal textarea").val("");
        htmlModal.hide();

    }

    function striptags(html, ...args) {
        return html
            .replace(/<(\/?)(\w+)[^>]*\/?>/g, (_, endMark, tag) => {
                return args.includes(tag) ? "<" + endMark + tag + ">" : "";
            })
            .replace(/<!--.*?-->/g, "");
    }
})(jQuery);

function initSortable() {
    $("table.table tbody").sortable({
        containerSelector: "tbody",
        itemSelector: "tr.sortable",
        placeholder: '<tr class="placeholder"/>'
    });
}
