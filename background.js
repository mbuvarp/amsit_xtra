

// Set up the .content div
function setupDom() {
    // Create DOM element
    var dom = $('<div/>').addClass('content');

    // Append h1 with gjengnavn
    dom.append(getGjeng());

    // Append the search form
    dom.append(getSearchForm());

    // Append "groups" div
    dom.append(createDivGroups());

    // Append "alle" div
    dom.append(createDivAlle());

    return dom;
}

// GET STUFF FROM ORIGINAL
// -----------------------------------------------------------

// Find all lists on the original site
function findAllEmailLists() {
    // Get list table anchor elements
    var trs = $('div.content table tr');
    
    // Iterate through all anchors and store href/listname
    var lists = [];
    $.each(trs, function(ind, val) {
        var a = $('a', val);
        var inputCsrf = $('form input[name="csrftoken"]', val);
        lists.push({ 'href': a.attr('href'), 'name': a.text(), 'csrftoken': inputCsrf.val() });
    });

    return lists;
}

// Get gjengnavn h1
function getGjeng() {
    return $('h1');
}
// Get search form
function getSearchForm() {
    return $('form[action="search.cgi"]');
}

// -----------------------------------------------------------

// CREATING SHIT ON MY OWN
// -----------------------------------------------------------

// Create the "groups" div
function createDivGroups() {
    var div = $('<div/>');

    div.append($('<h2/>').text('Groups'));
    div.append($('<input/>').attr({ 'type': 'text', 'id': 'addGroupName' }));
    div.append($('<button/>').text('Legg til gruppe').click(
        function() {
            var name = $('#addGroupName').val();
            if (name.length > 0)
                Storage.addGroup(name, function() { location.reload(); });
            else
                alert("Groupn må ha et navn.");
        })
    );

    Storage.getGroups(function(res) {
         var groups = res.groups;

         $.each(groups, function(ind, val) {
            div.append($('<h3/>').text(val.name));
         });
    });

    return div;
}
// Create the "alle" div
function createDivAlle() {
    var div = $('<div/>');

    div.append($('<h2/>').text('Alle'));

    var lists = findAllEmailLists();

    var tableRows = [];
    $.each(lists, function(ind, val) {
        var row = [];

        var tdLink = $('<a/>').attr('href', val.href).text(val.name);

        var tdForm = createTdForm(val.name, val.csrftoken);

        var tdGroupDropdown = $('<select/>');
        createGroupDropdown(tdGroupDropdown);

        tableRows.push([tdLink, tdForm, tdGroupDropdown]);
    });
    div.append(createTable(tableRows));

    return div;
}
// Create the form going in each table row
function createTdForm(listname, csrftoken) {
    var form = $('<form/>');

    form.attr({'action': 'delete_list.cgi', 'method': 'post'});
    form.append($('<input/>').attr({ 'type': 'hidden', 'name': 'listname', 'value': listname }));
    form.append($('<input/>').attr({ 'type': 'hidden', 'name': 'csrftoken', 'value': csrftoken }));
    form.append($('<input/>').attr({ 'type': 'submit', 'value': 'Slett liste' }));

    return form;
}

// Create a table from a list of rows
function createTable(rows) {
    var table = $('<table/>');

    $.each(rows, function(ind, val) {
        var tr = $('<tr/>');

        $.each(val, function(ind2, val2) {
            var td = $('<td/>');

            td.append(val2);

            tr.append(td);
        });

        table.append(tr);
    });

    return table;
}

// Create the gruppe dropwdown to be added to each element in "alle"
function createGroupDropdown(select) {

    var createSelects = function(res) {
        //console.log(groups);
        if (res.groups.length === 0) {
            select.append($('<option/>').val('null').text('Ingen grupper eksisterer'));
        } else {
            select.append($('<option/>').val('null').text('Ingen gruppe'));
            $.each(res.groups, function(ind, val) {
                select.append($('<option/>').val(val.name).text(val.name));
            });
        }
    }

    var groups = Storage.getGroups(createSelects);
}

// -----------------------------------------------------------

// STORAGE
// -----------------------------------------------------------

var Storage = {

    init: function() {
        var initGroups = function(res) {
            if (res.groups === undefined)
                chrome.storage.sync.set({ 'groups': [] }, function() {
                    console.log('Storage: "groups" created');
                });
        };
        this.getGroups(initGroups)
    },

    getGroups: function(callback) {
        return chrome.storage.sync.get('groups', callback);
    },
    addGroup: function(name, callback) {
        this.groupExists(name,
            // If it exists
            function() {
                alert('Gruppen eksisterer allerede.');
            },
            // If it doesn't
            function() {
                chrome.storage.sync.get('groups', function(res) {
                    var groups = res.groups;
                    groups.push({ 'name': name, 'members': [], 'subgroups': [] });
                    chrome.storage.sync.set({ 'groups': groups }, function() {
                        console.log('Storage: added group "' + name + '"')

                        if (callback !== undefined)
                            callback();
                    })
                });
            }
        );
    },
    groupExists: function(name, callbackSuccess, callbackFail) {
        this.getGroups(function(res) {
            var found = res.groups.find(function(elmt, ind, arr) {
                return elmt.name === name;
            });

            if (found !== undefined)
                callbackSuccess(found);
            else
                callbackFail();
        });
    },
    addToGroup: function(group, element, callback) {
        this.groupExists(group,
                        // If it exists
            function(found) {
                this.getGroups(function(res) {
                    var groups = res.groups;
                    
                });
            },
            // If it doesn't
            function() {
                alert('Gruppen eksisterer ikke. Vet ikke hva som gikk galt der.');
            }
    }

};

// -----------------------------------------------------------

//chrome.storage.sync.remove('groups', function() { console.log('Removed "groups"') });

Storage.init();

var content = $('div.content');
content.replaceWith(setupDom);