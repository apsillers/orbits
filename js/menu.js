$(function() {
    function showTabFunc(id) {
        return function() {
            $(".tab-body").removeClass("selected");
            $(".tab").removeClass("selected");
            $("#"+id+"-body").addClass("selected");
            $("#"+id+"-tab").addClass("selected");
            currentTool = id;
        };
    }

    $("#targets-tab").click(showTabFunc("targets"));
    $("#wells-tab").click(showTabFunc("wells"));
    $("#emitters-tab").click(showTabFunc("emitters"));
    $("#save-tab").click(showTabFunc("save"));
    $("#blocks-tab").click(showTabFunc("blocks"));
    $("#help-tab").click(showTabFunc("help"));

    $("#tool-save").on("click", function() {
        var name = $("#tool-name").val();
        var properties = propertiesFromTool(true);
        saveTarget(name, properties);
    });

    var types = JSON.parse(localStorage["targetTypes"]||"null");
    for(var name in types) {
       var properties = types[name];
       addTargetToList(name, properties);
    }

    $("#blocks-destructable").click(function() {
        if($(this).attr("checked")) {
            $("#blocks-hp").attr("disabled",null);
        } else {
            $("#blocks-hp").attr("disabled","disabled");
        }
    });
});

/* return a properties object from  */
function propertiesFromTool(withNameAndColor) {
    var p = {
             gravReaction:$("#tool-gravFactor").val(),
             smallSpeedup:$("#tool-speedup").val(),
             smallSlowdown:$("#tool-slowdown").val(),
             gravPull:$("#tool-power").val(),
             speedFactor:$("#tool-speedFactor").val(),
             radius:$("#tool-shotRadius").val(),
             edible:!!$("#tool-edible").attr("checked")
           };
    if(withNameAndColor) {
        p.color = $("#tool-color").val();
        p.name = $("#tool-name").val();
    }
    return p;
}

function propertiesToTool(p) {
     $("#tool-gravFactor").val(p.gravReaction);
     $("#tool-speedup").val(p.smallSpeedup);
     $("#tool-slowdown").val(p.smallSlowdown);
     $("#tool-power").val(p.gravPull);
     $("#tool-speedFactor").val(p.speedFactor);
     $("#tool-shotRadius").val(p.radius);
     $("#tool-edible").attr("checked", p.edible);
     $("#tool-color").val(p.color);
     $("#tool-name").val(p.name);
}

function getTarget(name) {
    var types = JSON.parse(localStorage["targetTypes"]||"null");
    if(!types) types = {};
    return types[name];
}

function saveTarget(name, properties) {
    var types = JSON.parse(localStorage["targetTypes"]||"null");
    if(!types) types = {};
    types[name] = properties;
    localStorage["targetTypes"] = JSON.stringify(types);
    var $item = $("#tool-list").find("#item-"+escape(name));
    if(!$item.size()) {
         addTargetToList(name, properties);
    }
}

function deleteTarget(name) {
    var types = JSON.parse(localStorage["targetTypes"]||"null");
    if(!types) types = {};
    delete types[name];
    localStorage["targetTypes"] = JSON.stringify(types);
    var $item = $("#tool-list").find("#item-"+escape(name));
    $item.remove();
}

function addTargetToList(name, properties) {
    var $newItem = $("<div class='target-item' id='item-"+escape(name)+"'>"+name+"</div>");
    var $deleteButton = $("<span class='target-item-delete'>X</span>");
    $newItem.append($deleteButton);
    $("#tool-list").append($newItem);
    $newItem.on("click", function() { propertiesToTool(getTarget(name)) });
    $deleteButton.on("click", function() { deleteTarget(name); return false; });
}

