# OpenPull-Web-Controller
---

## Introduction
The OpenPull-Web-Controller is an upgrade for the [DIY Universal test machine](https://github.com/CNCKitchen/Open-Pull) by [CNCKitchen](https://github.com/CNCKitchen).
It ads Bluetooth and Sd functionality to the test Maschine. 
The machine can be controlled over this webinterface: [https://iqwertz.github.io/VWA/](https://iqwertz.github.io/VWA/)

# Upgrade it
---

## Additional Hardware/ and Cad files
---

### CAD
There is an additional cad files for the Sdcard and Ble module holder available.

### Additional Hardware
- DC to Dc Buck Converter 24V-5V
- HM10 Ble Module
- Arduino MicroSD Card Module
- MicroSD Card

### Electronics
Currently the electronics are only as schematics and as images.

Note:

My scematics are for an arduino micro since it was the only one laying around and it has integrated SPI and Serial pins. The code can be modified to use the arduino nano with the software serial library. If there is an interest for it add it as an issue.

Adding an Sd Detect Pin:

My SD card Module didnt had an Sd Detect pin but I found out that it can be added very easy. Just solder a wire to the left pin on the module (red circle in the Picture) and wire it according to the scematics.

PICTURE of Sd Detect

## Set Up
---

When everything is wired up, upload the OpenPull.ino to the arduino. Then insert an empty SDcard and plugin the power supply. The Maschine is now ready.

[Measure Steps per mm]

## Use 
---

To use the Maschine go to [https://iqwertz.github.io/VWA/](https://iqwertz.github.io/VWA/).

Click on the Bluetooth Symbol in the Top left corner and select the Maschine (The Name is most of the time the producers Name. Mine is DSD Tech as an example.) When the connection is succesfull, you should be able to move it up and down by clicking the arrows.

### Interface

### Starting a new Test
