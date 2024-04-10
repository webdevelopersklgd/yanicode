<?php
$rsSections = CIBlockSection::GetList(
    Array("SORT" => "ASC"),
    Array(
        "=IBLOCK_ID" => $arParams['IBLOCK_ID'],
        "=ACTIVE"    => "Y"
    )
);

// Тут вместо инкрементного индекса, ID раздела
while ($arSection = $rsSections->GetNext())
    $arSections[$arSection['ID']] = $arSection;

// По нему производим неявную фильрацию
foreach($arResult["ITEMS"] as $arItem) {
    $arSections[$arItem['IBLOCK_SECTION_ID']]['ITEMS'][] = $arItem;
}

$arResult["SECTIONS"] = $arSections;