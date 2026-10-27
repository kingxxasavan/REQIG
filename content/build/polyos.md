# How we built PolyOS 7 for Debian

70 commits over 5 days, September 24 to 28, 2026, 66 of them written with Claude Code. In those five days PolyOS went from nothing to version 1.4.4 with signed online updates.

## What it is

PolyOS started as an operating system built in Scratch by our friend Perlexity (AndrewInput on Scratch) and the PIXAPoLY team. We rebuilt it as a birthday present for him: a real desktop that boots on real hardware.

Debian provides the kernel, drivers, Wi-Fi, sound and apps. PolyOS provides everything you see: the desktop, taskbar, Start menu, Files, Settings, Task Manager, Driver Manager, the PolyMarket app store, the Vara assistant, the login and lock screens, the boot splash, and the PolyOS 7 installer on the live USB. The interface is plain HTML, CSS and JavaScript running in WebKitGTK, and with `python main.py dev` it runs in any browser, so design work never needed a Linux machine.

## Timeline

* **September 24.** The desktop shell, apps, login screen and ISO build, then the installer, Task Manager, Driver Manager and PolyMarket on the same day.
* **September 25.** The PolyOS 7 login and lock screens, crystal wallpapers, Camera, new Settings, Gaming and Developer editions, the project website on Vercel, ARM64 ISOs, and automatic releases.
* **September 26.** Dual boot next to Windows, online updates, Poly Account, signed updates, and **PolyOS 1.0.0**, the first full release.
* **September 27.** Vara becomes a voice and agent assistant (1.2), the cleaned up PolyOS 7 (1.3), public ISO testing fixes, and "set up like one of your computers" (1.4).
* **September 28.** Tester fixes, your own wallpaper, a way out of full screen apps, and the Camera explaining a black screen (1.4.4).

## What Claude Code did

* Wrote the whole stack: the Python shell and system bridge, the HTML interface for every app, the installer engine, the update service, the website and the Poly Account API.
* Matched the original: it measured the PolyOS 7 palette from the Scratch costumes and rebuilt the dock, Start menu and setup screens to follow them.
* Built the release pipeline: GitHub Actions that build the ISO and publish a release whenever the version goes up, and Ed25519 signing so PolyOS only installs updates signed with our key.
* Tested the shell for real where it could, for example running it under Xvfb with Openbox and WebKitGTK to check full screen behavior.

## What we did by hand

* Got Perlexity's blessing to use the PolyOS name, logo and artwork, and sent screenshots of the Scratch original.
* Installed the ISO on real PCs and in virtual machines, dual booted next to Windows, and reported what broke.
* Created the release signing key, kept it secret, and added it to the repo's Actions secrets.
* Set up the Vercel project for the website and the Poly Account API, and the database it uses.
* Supplied the two crystal wallpapers PolyOS 7 uses (still to be license checked before wide distribution).

## Bugs we hit

* **Waking to a black screen.** The computer fell asleep before the lock screen finished drawing, and woke to a black window. PolyOS now holds a short sleep delay until the lock screen is ready, and redraws everything on wake (1.1.1).
* **The live USB looked frozen.** The screen turned off in the middle of installing. Found by installing the published ISO in a virtual machine (1.3.3).
* **GitHub rate limits.** The website's download and update checks used GitHub's API, which rate limits. They now work even when the API says no.
* **Setup stuck scrolled down.** On small screens a long setup step left the next one scrolled out of place (1.4.2).
* **The camera showed black.** Some laptops have Intel IPU6 cameras that need a driver, or a closed shutter. The Camera app now detects these and explains what to do instead of showing black (1.4.4).
* **Trapped in full screen.** A full screen app had no way out with the mouse. A bar now appears at the screen edge with Exit full screen, Minimize and Close (1.4.3).

## Lessons

* Fast releases need a real pipeline. Automatic ISO builds and signed updates let us ship more than a dozen versions in three days without breaking anyone.
* A browser preview of an OS (`main.py dev`) made every design change take seconds instead of a reboot.
* Install it yourself. The public ISO, a virtual machine and a real laptop each found bugs the others did not.
* Credit the people whose work you build on. PolyOS exists because Perlexity made it first.
