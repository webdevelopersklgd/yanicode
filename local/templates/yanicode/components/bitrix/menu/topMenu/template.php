<?php if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>

<?php if (!empty($arResult)):?>
<nav class="nav-list">

    <?php
    foreach($arResult as $arItem):
        if($arParams["MAX_LEVEL"] == 1 && $arItem["DEPTH_LEVEL"] > 1)
            continue;
    ?>
        <?php if($arItem["SELECTED"]):?>
            <a href="<?=$arItem["LINK"]?>" class="nav-list__item"><?=$arItem["TEXT"]?></a>
        <?php else:?>
            <a href="<?=$arItem["LINK"]?>" class="nav-list__item"><?=$arItem["TEXT"]?></a>
        <?php endif?>

    <?php endforeach?>

</nav>
<?php endif?>