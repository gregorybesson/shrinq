'use strict'

const { ipcRenderer } = require('electron')
const {dialog} = require('electron').remote;

// listen for the form to be submitted
const submitListener = document
  .querySelector('form')
  .addEventListener('submit', (event) => {
    // prevent default behavior that causes page refresh
    event.preventDefault()
})

const submitListener2 = document
  .querySelector('#selectBtn')
  .addEventListener('click', function (event) {
    dialog.showOpenDialog({
        properties: ['openFile', 'openDirectory', 'multiSelections']
    }, function (files) {
      if (files !== undefined) {
        const table = document.getElementById('data')
        table.innerHTML = ''
        ipcRenderer.send('files', files)
      }
    });
});

// metadata from the main process
ipcRenderer.on('metadata', (event, metadata) => {
  const table = document.getElementById('data')
  var aNode = document.createElement("a");
  aNode.setAttribute('href', `${metadata.file}`);
  aNode.setAttribute('target', '_blank');
  aNode.innerText = `${metadata.file}`
  var tdNode1 = document.createElement("td");
  tdNode1.appendChild(aNode);
  var textNode2 = document.createTextNode(`${metadata.src_size}`);
  var tdNode2 = document.createElement("td");
  tdNode2.appendChild(textNode2);
  var textNode3 = document.createTextNode(`${metadata.dest_size}`);
  var tdNode3 = document.createElement("td");
  tdNode3.appendChild(textNode3);
  var textNode4 = document.createTextNode(`${metadata.percent}`);
  var tdNode4 = document.createElement("td");
  tdNode4.appendChild(textNode4);
  var trNode = document.createElement("tr");
  trNode.appendChild(tdNode1);
  trNode.appendChild(tdNode2);
  trNode.appendChild(tdNode3);
  trNode.appendChild(tdNode4);
  table.appendChild(trNode)
})

// error event from catch block in main process
ipcRenderer.on('metadata:error', (event, error) => {
  console.error(error)
})
