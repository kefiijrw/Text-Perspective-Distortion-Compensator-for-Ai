# Text Perspective Distortion Compensator for Adobe Illustrator

Скрипт для Иллюстратора точечно модифицирует пропорций и размеры букв, улучшая читабельность плотных макетов с мелкими надписи, на которые зритель будет смотреть под углом. Обычно это размещенные высоко табло в аэропортах и вокзалах, меню над барной стойкой, навигационные носители и т.д.

![frame](https://user-images.githubusercontent.com/8041203/197364496-860a54fd-02ab-4616-986c-b9fb6564cd3b.jpg)

Принцип работы: скрипту передается положение макета относительно некоторого усредненного положения глаз наблюдателя, скрипт рассчитывает перспективные искажения каждой строки текста и компенсирует их растягиванием и увеличением символов, таким образом улучшая читабельность текста. Как-то так:

Ему задается положение макета относительно глаз наблюдающего, и он для каждой строки определяет

![en_4k_0 5_16c_new_black](https://user-images.githubusercontent.com/8041203/197365202-0fd3a9f1-3344-4b38-b3fd-e0982bf80b34.gif)

![perspective_compensation_before_and_after_long_title_un](https://user-images.githubusercontent.com/8041203/197288727-b58de5c4-8d54-4a9b-a8ce-a4c7fac977f2.png)

Скрипт также умеет компенсировать интерлиньяж, сохранять пропорции символов и другие штуки. Поддерживаются и Area Type, и Point Type, но у них есть особенности, о которых ниже. 


## Параметры скрипта
остальные параметры выставляются в открывающейся панели настроек

![Screenshot 2022-10-23 at 16 07 copy](https://user-images.githubusercontent.com/8041203/197394432-c13cf4a9-5fb7-4069-9e15-a87eae2f04d7.png)


### Уровень глаз

Уровень глаз наблюдателя определяется по линии в слое eyes_level.

![2022-10-31-14 57 37_](https://user-images.githubusercontent.com/8041203/199012228-7b56f9a0-6e3b-4b91-a9ab-ca08dd7a1043.gif)

Скрипт обрабатывает выделенные текстовые поля, а если ничего не выбрано — то все текстовые поля в файле. 

### Дистанция

![2022-10-31 16 37 38](https://user-images.githubusercontent.com/8041203/199022245-74fa1bec-cdf6-41c2-9711-4a056b573f17.gif)


Следующие два ползунка отвечают за меру компенсации перспективы и размера. Что

![2d-for-ae-2-1500-20fps-8c](https://user-images.githubusercontent.com/8041203/197311413-e4dbb8fd-4a30-48ed-87a3-4de976f5f4ee.gif)

### Коэффициент компенсации искажений

![2-ползунок компенсации перспективы](https://user-images.githubusercontent.com/8041203/197292120-078989ce-0e74-45dd-8c25-cddb20dfa6ad.gif)

![2022-10-31 23 43 34](https://user-images.githubusercontent.com/8041203/199113319-6c304834-c241-4eb8-afc3-19d58df6bfad.gif)

### Коэффициент компенсации размера

![2022-11-01 00 38 59](https://user-images.githubusercontent.com/8041203/199118277-b705f088-e9f0-4390-a4f9-f43cc0da7d59.gif)

![4 - компенсация размера](https://user-images.githubusercontent.com/8041203/197292189-35a4c751-0cd7-4e0f-9b9b-2065d48b9c8c.gif)

этот параметр работает по-разному для Point Type и Area Type:

![5 - различие при обработкe area type и point type](https://user-images.githubusercontent.com/8041203/197292276-1ee4e953-66e5-47c6-b4b6-7ef5e04d72bd.gif)

### Cохранения интерлиньяжа

![6 - коэффициент интерлиньяжа](https://user-images.githubusercontent.com/8041203/197294453-5061d55a-20bc-49a9-8794-6d3f39c7330f.gif)


## Рекомендации по применению
![1 NviNPutzBP2_-z4tXUNr0g](https://user-images.githubusercontent.com/8041203/197294538-cba6b7cd-5796-4d4a-a185-2930b9840d5a.gif)


![1 2sO2lBul8YeOq8Ojbtmj0w](https://user-images.githubusercontent.com/8041203/197294542-985e373a-7fe9-4b1b-84a1-a12f94934b27.gif)


