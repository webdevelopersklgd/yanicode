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

<div class="popup-services-cover">
    <div class="popup-services__title">БРЕНДИНГ</div>
    <div class="popup-services__category"><?php echo $arResult["NAME"]?></div>


    <div class="popup-services__desc">
        <?echo $arResult["DETAIL_TEXT"];?>
    </div>

</div>

