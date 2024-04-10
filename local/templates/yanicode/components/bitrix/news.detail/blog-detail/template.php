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

<div class="container blog_article">
    <img
            width="100%"
            height="100%"
            src="<?=$arResult["DETAIL_PICTURE"]["SRC"]?>"
            alt="<?=$arResult["DETAIL_PICTURE"]["ALT"]?>"
    />

    <h1><?=$arResult["NAME"]?></h1>

    <?if($arResult["DETAIL_TEXT"] <> ''):?>
        <?echo $arResult["DETAIL_TEXT"];?>
    <?endif;?>

</div>
