<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @global CUser $USER */
/** @global CDatabase $DB */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */
/** @var CBitrixComponent $component */
$this->setFrameMode(true);
?>

<div class="services-cover">
<?foreach ($arResult["SECTIONS"] as $arSection):?>
    <div class="services">
        <h2 class="services__title"><?=$arSection["NAME"]?></h2>
        <div class="services-category">
            <?foreach ($arSection["ITEMS"] as $arItem):?>
                <div class="services__item" data-popup="services-popup">
                    <?=$arItem["NAME"]?>
                </div>
            <?endforeach?>
        </div>
    </div>
<?endforeach?>
</div>



