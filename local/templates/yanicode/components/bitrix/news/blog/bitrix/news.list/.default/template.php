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


<div class="blog-list">
<?if($arParams["DISPLAY_TOP_PAGER"]):?>
    <?=$arResult["NAV_STRING"]?><br />
<?endif;?>
<?foreach($arResult["ITEMS"] as $arItem):?>
<?
$this->AddEditAction($arItem['ID'], $arItem['EDIT_LINK'], CIBlock::GetArrayByID($arItem["IBLOCK_ID"], "ELEMENT_EDIT"));
$this->AddDeleteAction($arItem['ID'], $arItem['DELETE_LINK'], CIBlock::GetArrayByID($arItem["IBLOCK_ID"], "ELEMENT_DELETE"), array("CONFIRM" => GetMessage('CT_BNL_ELEMENT_DELETE_CONFIRM')));
?>
        <a href="<?=$arItem["DETAIL_PAGE_URL"]?>" class="blog">
            <div class="blog__img">
                <img width="100%" height="100%" src="<?=$arItem["PREVIEW_PICTURE"]["SRC"]?>" alt="">
            </div>
            <div class="blog__desc">
                <?if($arParams["DISPLAY_NAME"]!="N" && $arItem["NAME"]):?>
                    <div class="blog__title">
                        <?echo $arItem["NAME"]?>
                    </div>
                <?endif;?>
                <?if($arParams["DISPLAY_DATE"]!="N" && $arItem["DISPLAY_ACTIVE_FROM"]):?>
                    <div class="blog__date">
                        <?echo $arItem["DISPLAY_ACTIVE_FROM"]?>
                    </div>
                <?endif?>
                <?if($arParams["DISPLAY_PREVIEW_TEXT"]!="N" && $arItem["PREVIEW_TEXT"]):?>

                <?endif;?>
                <div class="blog_article">
                    <?echo $arItem["PREVIEW_TEXT"];?>
                </div>
            </div>
        </a>
<?php endforeach; ?>
</div>

<script>

</script>