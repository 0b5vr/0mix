# 0mix

```
================================================================================

             ::::::    ::::::::    ::::::::::  ::      ::  ::::::::::
           ::      ::  ::      ::  ::          ::      ::  ::      ::
           ::  ::  ::  ::::::::    ::::::::::  ::      ::  ::::::::::
           ::      ::  ::      ::          ::    ::  ::    ::    ::
             ::::::    ::::::::    ::::::::::      ::      ::      ::

           0b5vr GLSL Techno Live Set - "0mix"
           A 64KB WebGL Intro by 0b5vr - 7m20s - 140bpm
           Appeared in the Revision 2023 PC 64K Intro Compo

                                                   Live Coding: 0b5vr
                                                            VJ: 0b5vr

================================================================================

Intended to make crowds in E Werk do the hazy dancing

Boasting to the Algorave scene :)

Fucking to the JP generative art scene
that degenerated into a full of fungus shit

--------------------------------------------------------------------------------

This prod was, of course, inspired by Emix
Much love to my senpai, noby
https://www.pouet.net/prod.php?which=66066

Project Genesis by Conspiracy turned 20 years old today!
Shoutouts to Conspiracy, you are always the one big inspiration for me
https://www.pouet.net/prod.php?which=9438

The VRChat club scene inspired me a lot during the making of this prod
Shoutouts to Rie, Reflex, and Killu
https://booth.pm/ja/items/3528858
https://booth.pm/ja/items/3532344
https://booth.pm/ja/items/3243964

Still craving for how this prod has been made? Here's my log (ja):
https://github.com/0b5vr/0mix/blob/release/reflection.md

--------------------------------------------------------------------------------

UPDATE 2023-07-08: FINAL VERSION

I'm finally back from Hyrule!

- Slightly revised the shape of the car headlight in the Section3Scene.
  Shoutouts to LJ for Roadtrip.
- Added an option to render music offline. No more audio stutter!
- Added an option to hide codes.
- Firefox support! Firefox finally supports DecompressionStream API in 113.

--------------------------------------------------------------------------------

I checked this intro works in:

- Windows 11 22H2
- Chrome 114, Firefox 114
- AMD Ryzen 9 5900X
- NVIDIA GeForce RTX 3080
- 1920 x 1080 @ 60Hz

It doesn't work in the form of a mere html file!
You need to do either of them:

- Put `--allow-file-access-from-files` on the Chrome startup option,
  as the Revision rule specifies.
- Start a local server that serves the html file.

--------------------------------------------------------------------------------

(c) 2023 0b5vr
https://0b5vr.com

This prod is distributed under CC BY-NC 4.0
https://creativecommons.org/licenses/by-nc/4.0/

================================================================================
```

- [Watch the demo](https://0b5vr.com/0mix/0mix.html)
- [reflection.md](./reflection.md)
- [kpt.md](./kpt.md)
- [YouTube](https://youtu.be/3lOptjAeA2w)
- [pouet](https://www.pouet.net/prod.php?which=94135)
- [Demozoo](https://demozoo.org/productions/322650/)

### How to build

```bat
yarn
yarn build
```

#### Need a jsexe build?

```bat
jsexe -cn -po .\dist\assets\index.<hash>.js .\dist\jsexe.png.html
```

### License

[CC BY-NC 4.0](./LICENSE)
