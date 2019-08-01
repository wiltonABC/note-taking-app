// DB Initialization
let dbRequest = indexedDB.open("notesdb");
let database = null;

dbRequest.onupgradeneeded = () => {
    database = dbRequest.result;
    database.createObjectStore("notes", {autoIncrement : true});
    let configStore = database.createObjectStore("config", {keyPath : "configName"});

    configStore.put({id : "yellow-button", configName : "colorId"});
};

dbRequest.onsuccess = () => {
    database = dbRequest.result;

    //Retrive color config
    readConfigFromDatabase(database);

    //Retrieve existing notes
    readNotesFromDatabase(database);
};
//DB Initialization end

let colorPicker = document.querySelector(".color-picker");
colorPicker.addEventListener("click", (event)=> {
    if (event.target.classList.contains("radio-group")) {
        let radio = event.target;
        let configStore = database.transaction("config", "readwrite")
            .objectStore("config");
        let request = configStore
            .get("colorId");

        request.onsuccess = () => {
            let config = request.result;
            config.id = radio.id;

            configStore.put(config);
        }    

        let colorButton = event.target;

        setNotesColors(colorButton);

        setAddButtonColor(colorButton);
    }
});

let container = document.querySelector(".container");
container.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-button")) {
        let note = event.target.parentNode.parentNode;
        let hiddenId = note.lastChild;

        let request = database.transaction("notes", "readwrite")
            .objectStore("notes")
            .delete(Number(hiddenId.value));

        request.onsuccess = () => {
            note.classList.add("fadeout");
            setTimeout(() => {
                note.remove();
            }, 500); 
        };
    }
});

container.addEventListener("keyup", debounce((event) => {
    if (event.target.tagName == "TEXTAREA") {
        let hiddenId = event.target.nextSibling;
        saveNote(hiddenId.value, event.target.value);
    }
},1000));

let addButton = document.getElementById("addButton");
addButton.addEventListener("click", () => {
    let transaction = database.transaction("notes", "readwrite");
    let noteStore = transaction.objectStore("notes");

    let request = noteStore.put({text : ""});

    request.onsuccess = (event) => {
        let generatedNoteId = event.target.result;
        createNote(generatedNoteId, "");
    };

});

function setAddButtonColor(colorButton) {
    let backgroundColor = window
        .getComputedStyle(colorButton,null).getPropertyValue("background-color");
    let addButton = document.getElementById("addButton");
    addButton.style.backgroundColor = backgroundColor;
}

function setNotesColors(colorButton) {
    let notes = document.querySelectorAll(".note");
    notes.forEach((note) => {
        setNoteColor(note, colorButton)
    });
}

function setNoteColor(note, colorButton) {
    let backgroundColor = window
        .getComputedStyle(colorButton,null).getPropertyValue("background-color");
    note.firstElementChild.style.backgroundColor = backgroundColor;
    note.style.backgroundColor = getLightColor(colorButton.id);
}

function getLightColor(colorButtonId) {
    let color = "lightyellow";
    switch (colorButtonId) {
        case "yellow-button":
            color = "lightyellow";
            break;
        case "blue-button":
            color = "lightblue";
            break;
        case "red-button":
            color = "lightcoral";
            break;
        case "green-button":
            color = "lightgreen";
            break;
        case "pink-button":
            color = "lightpink";

    }
    
    return color;

}

function readNotesFromDatabase(database) {
    let transaction = database.transaction("notes", "readonly");
    let noteStore = transaction.objectStore("notes");
    noteStore.openCursor().onsuccess = (event) => {
        let cursor = event.target.result;
        if (cursor) {
            //Get note data and create a note
            createNote(cursor.key, cursor.value.text);
            cursor.continue();
        }
    };
}

function createNote(id, text) {

    let note = document.createElement("div");
    let noteHeader = document.createElement("div");
    let removeButton = document.createElement("span");
    let noteBody = document.createElement("textarea");
    let hiddenId = document.createElement("input");
    hiddenId.setAttribute("type", "hidden");
    hiddenId.setAttribute("id", id);
    hiddenId.setAttribute("value", id);

    removeButton.textContent = "\u2613";
    removeButton.classList.add("remove-button");
    noteHeader.appendChild(removeButton);

    noteBody.value = text;
    
    note.classList.add("note");
    note.appendChild(noteHeader);
    note.appendChild(noteBody);
    note.appendChild(hiddenId);

    note.classList.add("fadein");
    container.appendChild(note);

    let transaction = database.transaction("config", "readonly");
    let configStore = transaction.objectStore("config");
    let request = configStore.get("colorId");

    request.onsuccess = () => {
        let config = request.result;
        let radioButton = document.getElementById(config.id);
        setNoteColor(note, radioButton);
    }

}

function readConfigFromDatabase(database) {
    let transaction = database.transaction("config", "readonly");
    let configStore = transaction.objectStore("config");
    let request = configStore.get("colorId");

    request.onsuccess = () => {
        let config = request.result
        let radioButton = document.getElementById(config.id);
        radioButton.checked = true;
        let addButton = document.getElementById("addButton");
        addButton.style.backgroundColor = window
            .getComputedStyle(radioButton,null).getPropertyValue("background-color");
        
        document.documentElement.classList.remove("js");
    };
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

function saveNote(id, text) {
    let transaction = database.transaction("notes", "readwrite");
    let noteStore = transaction.objectStore("notes");
    let request = noteStore.get(Number(id));

    request.onsuccess = () => {
        let note = request.result;
        note.text = text;

        noteStore.put(note, Number(id));
    };
}

