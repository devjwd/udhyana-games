========================================================================
       UDHYANA GAMES - NEC VERSAPRO STATION POD SETUP GUIDE
========================================================================

Follow these 3 quick steps on each of your 5 NEC VersaPro tablets:

------------------------------------------------------------------------
STEP 1: COPY THIS FOLDER TO A USB FLASH DRIVE
------------------------------------------------------------------------
- Plug any USB flash drive into your main Reception PC.
- Copy this entire folder ("UDHYANA_STATION_POD") to the USB drive.

------------------------------------------------------------------------
STEP 2: RUN THE SETUP ON THE NEC VERSAPRO TABLET
------------------------------------------------------------------------
- Plug the USB drive into the NEC VersaPro tablet.
- Open the USB drive and open the "UDHYANA_STATION_POD" folder.
- Double-click: 
    1_SETUP_THIS_POD.bat

- (If Windows asks "Do you want to allow this app to make changes?", click YES).

------------------------------------------------------------------------
STEP 3: SELECT THE STATION NUMBER
------------------------------------------------------------------------
The installer will automatically:
  1. Detect the server IP from "server_ip.txt" (192.168.1.28)
  2. Prevent the tablet from sleeping or turning off the screen (24/7 Kiosk)
  3. Scan and re-enable the touch screen digitizer hardware
  4. Turn up the chime volume to 85%

When prompted:
  Choose [1] for Station 1 (PS5)
  Choose [2] for Station 2 (Xbox Series X)
  Choose [3] for Station 3 (Xbox Series X 2)
  Choose [4] for Station 4 (Steering Wheel + PS4)
  Choose [5] for Custom Station name

- Press ANY KEY to launch the full-screen pod monitor immediately!

------------------------------------------------------------------------
EXTRA UTILITIES INCLUDED IN THIS FOLDER:
------------------------------------------------------------------------
- FIX_TOUCH_SCREEN.bat : 
    Run this anytime if the touch screen stops responding on the NEC.
    It automatically restarts the HID service and re-enables the digitizer.

- TEST_POD_NOW.bat : 
    Quickly tests full-screen kiosk mode without altering startup settings.

- REMOVE_POD_STARTUP.bat : 
    Removes the automatic boot shortcut if you ever want to use the tablet
    for something else.

------------------------------------------------------------------------
HOW TO EXIT KIOSK MODE ON THE TABLET AT ANY TIME:
------------------------------------------------------------------------
- Press [Alt] + [F4] on a keyboard, or swipe from the top/bottom and close Edge.
========================================================================
