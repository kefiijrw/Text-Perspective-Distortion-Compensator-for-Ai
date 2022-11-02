# Text Perspective Distortion Compensator for Adobe Illustrator

![perspective_compensation_before_and_after_long_title_un](https://user-images.githubusercontent.com/8041203/197288727-b58de5c4-8d54-4a9b-a8ce-a4c7fac977f2.png)

The script for Adobe Illustrator tweaks the proportions and sizes of the letters, improving the readability of the text that the audience will be looking at from an angle. This is especially critical for dense layouts with small letters: high-mounted signage in airports and train stations, menus over the bar, wayfinding materials, etc.

![frame](https://user-images.githubusercontent.com/8041203/197364496-860a54fd-02ab-4616-986c-b9fb6564cd3b.jpg)

The script gets the position of the layout relative to some average observer's eye position, calculates the perspective distortion of each line of text, and compensates for it by stretching and enlarging the characters, thus improving the readability of the text.

![en_4k_0 5_16c_new_black](https://user-images.githubusercontent.com/8041203/197365202-0fd3a9f1-3344-4b38-b3fd-e0982bf80b34.gif)


The script also knows how to compensate for leading and the smallness of far lines, and maintain the proportions of characters. Both `Area Type` and `Point Type` are supported, but they have special aspects, which are described below.


## Script Settings: layout position

The position of the layout relative to the observer's eyes is determined by two parameters: the position of the layout relative to the eye level and the distance from the plane of the media to the eyes.

![Screenshot 2022-11-02 at 14 05 49](https://user-images.githubusercontent.com/8041203/199474701-844e8efc-3455-4202-9e4c-a659b80041f0.png)

The observer's eye level is determined by the line in the `eyes_level` layer, and the `distance` is set in the script settings panel.

![2022-11-01 18 13 05](https://user-images.githubusercontent.com/8041203/199302426-a56a7dd2-4d22-4357-8a10-a603d3164d9f.gif)

The shorter the distance, the greater the distortion, and the stronger the effect of their compensation. 

By default, the script assumes that the layout is already at 100% scale. If it becomes crowded on the canvas, you can reduce the layout simultaneously with a multiple of the distance parameter. For example, instead of a 5×5 meter layout with a distance of 10 meters, you can run the script on a 1×1 meter layout with a distance of 2 meters, and the result will be identical.


## Script Settings: compensation coefficients

The other three sliders on the settings panel are responsible for the compensation coefficients.

<img width="438" alt="Screenshot 2022-10-28 at 00 36 54" src="https://user-images.githubusercontent.com/8041203/199521264-edcf9e5a-2b25-45ba-9f01-98951f71a601.png">

Characters on lines above eye level not only optically squeeze vertically due to perspective distortion, but also look smaller than characters on lower lines due to the fact that they are further away from the eye. Therefore, the script has two separate parameters: `perspective compensation` and `size compensation`. The picture can help to understand the difference between the two types of optical compensation:

![2d-for-ae-2-1500-20fps-8c](https://user-images.githubusercontent.com/8041203/197311413-e4dbb8fd-4a30-48ed-87a3-4de976f5f4ee.gif)

### Perspective compensation

Responsible for stretching the letters vertically to counterbalance their optical squeeze due to viewing at an angle. 

0 — off

1 — full compensation, from a specified distance all characters will optically look in their original proportions

![2022-10-31 23 43 34](https://user-images.githubusercontent.com/8041203/199113319-6c304834-c241-4eb8-afc3-19d58df6bfad.gif)
![Asset 1-persp_max copy 2](https://user-images.githubusercontent.com/8041203/199505008-f5f0f6ca-c184-4051-b0d4-443ac7acfa24.png)

### Size compensation

Responsible for simply increasing the size of the letters without changing their proportions to counterbalance their smaller optical size.

0 — off

1 — letters will enlarge in proportional to the distance to the eye, compensating for the difference in optical size of characters from different lines

![2022-11-01 00 38 59](https://user-images.githubusercontent.com/8041203/199118277-b705f088-e9f0-4390-a4f9-f43cc0da7d59.gif)
![Asset 1-size_max copy 2](https://user-images.githubusercontent.com/8041203/199504979-752800fe-8185-4af9-a994-75312bd56520.png)

This option can significantly change the layout: when processing an Area Type text field, letters that have increased in width may no longer fit into the fixed line width and will be moved to a new line. When processing Point Type, the lines are simply extended:

![Screenshot 2022-11-01 at 13 31 20](https://user-images.githubusercontent.com/8041203/199217036-b7c224f2-a7a5-4780-8b8f-5a3c6a9a36df.png)

### Leading compensation

0 — leading remains unchanged

1 — leading is proportional to the height of the characters

Stretching letters without leading compensation may cause lines to stick together, but increasing the leading will cause the lines to shift on the layout.

![2022-11-01 23 50 07](https://user-images.githubusercontent.com/8041203/199339105-d98999a8-2e28-4df3-9a65-2aaaba930a73.gif)
![Asset 1-leading_max copy 2](https://user-images.githubusercontent.com/8041203/199504927-da29a864-4d3c-4672-a303-085e8dedfa8a.png)


## Recommendations for use

If you go crazy and turn all the sliders to maximum, you can get full compensation: optically, the size of the letters and the spacing will be the same for all lines.

![1 NviNPutzBP2_-z4tXUNr0g](https://user-images.githubusercontent.com/8041203/197294538-cba6b7cd-5796-4d4a-a185-2930b9840d5a.gif)

But it is probably not a good idea. The script calculates compensation for a certain distance, and the resulting layout looks good only from this angle. From another position the layout will already look creepy and broken.

![1 2sO2lBul8YeOq8Ojbtmj0w](https://user-images.githubusercontent.com/8041203/197294542-985e373a-7fe9-4b1b-84a1-a12f94934b27.gif)

This is why I recommend using the coefficient sliders carefully and not moving them much farther than the middle. Then the changes made by the script will be useful, but will not be eye-catching, remaining little-noticeable optical compensations.
