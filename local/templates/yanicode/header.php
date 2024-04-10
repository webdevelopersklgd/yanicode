<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

global $APPLICATION;

use Bitrix\Main\Page\Asset;

Asset::getInstance()->addString('<meta http-equiv="x-ua-compatible" content="ie=edge">');
Asset::getInstance()->addString('<meta class="js-meta-viewport" name="viewport" content="width=device-width, height=device-height, initial-scale=1, shrink-to-fit=no, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">');
Asset::getInstance()->addString('<meta name="format-detection" content="telephone=no">');



Asset::getInstance()->addJs(SITE_TEMPLATE_PATH . '/assets/js/vendor/inputmask.min.js');
Asset::getInstance()->addJs(SITE_TEMPLATE_PATH . '/assets/js/build.js');

Asset::getInstance()->addJs(SITE_TEMPLATE_PATH . '/assets/js/vendor/inputmask.min.js');
Asset::getInstance()->addJs(SITE_TEMPLATE_PATH . '/assets/js/vendor/swiper-bundle.min.js');
Asset::getInstance()->addJs(SITE_TEMPLATE_PATH . '/assets/js/build.js');
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <title><?php $APPLICATION->ShowTitle();?></title>
    <?php $APPLICATION->ShowHead(); ?>
    <link rel="stylesheet" href="<?php echo SITE_TEMPLATE_PATH?>/assets/css/jquery.fancybox-1.3.4.css" type="text/css" media="screen" />
</head>

<body>
<?php $APPLICATION->ShowPanel(); ?>
<header class="header">
    <div class="container">
        <div class="header-wrapper">
            <a href="/" class="header__logo">
                <img width="300" height="92" src="<?php echo SITE_TEMPLATE_PATH . '/assets/images/svg/logo-yanicode.svg'?>" alt="yanicode">
            </a>
            <div class="header__burger header__burger_close">
                <span class="burger-line"></span>
                <span class="burger-line"></span>
                <span class="burger-line"></span>
            </div>
            <div class="header-nav">


                    <?php
                        $APPLICATION->IncludeComponent("bitrix:menu", "topMenu", Array(
                        "ROOT_MENU_TYPE" => "top",	// Тип меню для первого уровня
                            "MAX_LEVEL" => "1",	// Уровень вложенности меню
                            "CHILD_MENU_TYPE" => "top",	// Тип меню для остальных уровней
                            "USE_EXT" => "Y",	// Подключать файлы с именами вида .тип_меню.menu_ext.php
                            "DELAY" => "N",	// Откладывать выполнение шаблона меню
                            "ALLOW_MULTI_SELECT" => "Y",	// Разрешить несколько активных пунктов одновременно
                            "MENU_CACHE_TYPE" => "N",	// Тип кеширования
                            "MENU_CACHE_TIME" => "3600",	// Время кеширования (сек.)
                            "MENU_CACHE_USE_GROUPS" => "Y",	// Учитывать права доступа
                            "MENU_CACHE_GET_VARS" => "",	// Значимые переменные запроса
                            "COMPONENT_TEMPLATE" => "catalog_horizontal",
                            "MENU_THEME" => "site"
                        ),
                        false
                    );

                    ?>

                <div class="header__phone">
                    <a href="tel:+79114510616">+79114510616</a>
                </div>
            </div>
        </div>
    </div>
</header>
<main class="website-workarea">