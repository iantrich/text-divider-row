# 🗂 Text Divider Row

This card is for [Lovelace](https://www.home-assistant.io/lovelace) on [Home Assistant](https://www.home-assistant.io/) to display a text divider in an entities card

[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE.md)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg?style=for-the-badge)](https://github.com/hacs/integration)

![Project Maintenance][maintenance-shield]
[![GitHub Activity][commits-shield]][commits]

[![Discord][discord-shield]][discord]
[![Community Forum][forum-shield]][forum]

[![Twitter][twitter]][twitter]
[![Github][github]][github]

## Support

Hey dude! Help me out for a couple of :beers: or a :coffee:!

[![coffee](https://www.buymeacoffee.com/assets/img/custom_images/black_img.png)](https://www.buymeacoffee.com/zJtVxUAgH)

## Installation

Use [HACS](https://hacs.xyz) or follow this [guide](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins)

```yaml
resources:
  url: /local/text-divider-row.js
  type: module
```

![example](example.png)
![example2](example2.png)

## Options

| Name | Type   | Requirement  | Description                |
| ---- | ------ | ------------ | -------------------------- |
| type | string | **Required** | `custom:text-divider-row`  |
| text | string | **Required** | Text to display in divider |
| align | string | Optional | Specifies the text alignment. Must be: 'left', 'center' or 'right' |

## Theme Variables

The following variables are available and can be set in your theme to change the appearance of the lock.
Can be specified by color name, hexadecimal, rgb, rgba, hsl, hsla, basically anything supported by CSS.

| name                     | Default                | Description    |
| ------------------------ | ---------------------- | -------------- |
| `text-divider-color`     | `secondary-text-color` | Divider color  |
| `text-divider-font-size` | `14px`                 | Font size      |
| `text-divider-line-size` | `1px`                  | Line size      |
| `text-divider-margin`    | `1em 0`                | Divider margin |

## [Troubleshooting](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins)

[commits-shield]: https://img.shields.io/github/commit-activity/y/iantrich/text-divider-row.svg?style=for-the-badge
[commits]: https://github.com/iantrich/text-divider-row/commits/master
[discord]: https://discord.gg/Qa5fW2R
[discord-shield]: https://img.shields.io/discord/330944238910963714.svg?style=for-the-badge
[forum-shield]: https://img.shields.io/badge/community-forum-brightgreen.svg?style=for-the-badge
[forum]: https://community.home-assistant.io/t/lovelace-text-divider-row/111301
[license-shield]: https://img.shields.io/github/license/iantrich/text-divider-row.svg?style=for-the-badge
[maintenance-shield]: https://img.shields.io/badge/maintainer-Ian%20Richardson%20%40iantrich-blue.svg?style=for-the-badge
[releases-shield]: https://img.shields.io/github/release/iantrich/text-divider-row.svg?style=for-the-badge
[releases]: https://github.com/iantrich/text-divider-row/releases
[twitter]: https://img.shields.io/twitter/follow/iantrich.svg?style=social
[github]: https://img.shields.io/github/followers/iantrich.svg?style=social
