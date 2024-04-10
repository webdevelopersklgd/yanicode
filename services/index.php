<?
require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/header.php");
$APPLICATION->SetTitle("Услуги");
?>
    <section
            class="banner banner_before54"
            style="background-image: url(<?= SITE_TEMPLATE_PATH . '/assets/images/banner_services.jpg' ?>)"
    >
        <div class="banner-wrapper">
            <div class="container">
                <div class="banner__content">
                    <p>
                        <b class="text_gold">НАША МИССИЯ: </b>создаем и внедряем<br />
                        инновационные ценностные<br />
                        предложения и концепции, влияющие на<br />
                        формирование рынка потребительских<br />
                        предпочтений и способствующие<br />
                        достижению бизнес-целей
                    </p>
                </div>
            </div>
        </div>

        <div class="container">
            <div class="stages">
                <div class="stages__item">
                    <div class="stages__step">01</div>
                    <div class="stages__desc-step">АУДИТ</div>
                </div>
                <div class="stages__item">
                    <div class="stages__step">02</div>
                    <div class="stages__desc-step">СТРАТЕГИЯ</div>
                </div>
                <div class="stages__item">
                    <div class="stages__step">03</div>
                    <div class="stages__desc-step">КОНЦЕПЦИЯ</div>
                </div>
                <div class="stages__item">
                    <div class="stages__step">04</div>
                    <div class="stages__desc-step">ДИЗАЙН</div>
                </div>
                <div class="stages__item">
                    <div class="stages__step">05</div>
                    <div class="stages__desc-step">КОММУНИКАЦИИ</div>
                </div>
            </div>
        </div>
    </section>

<div class="container">
    <h1 class="container-title">НАШИ УСЛУГИ</h1>
        <?$APPLICATION->IncludeComponent(
	"bitrix:news.list", 
	"services", 
	array(
		"ACTIVE_DATE_FORMAT" => "d.m.Y",
		"ADD_SECTIONS_CHAIN" => "Y",
		"AJAX_MODE" => "Y",
		"AJAX_OPTION_ADDITIONAL" => "",
		"AJAX_OPTION_HISTORY" => "N",
		"AJAX_OPTION_JUMP" => "N",
		"AJAX_OPTION_STYLE" => "Y",
		"CACHE_FILTER" => "N",
		"CACHE_GROUPS" => "Y",
		"CACHE_TIME" => "36000000",
		"CACHE_TYPE" => "A",
		"CHECK_DATES" => "Y",
		"DETAIL_URL" => "",
		"DISPLAY_BOTTOM_PAGER" => "Y",
		"DISPLAY_DATE" => "Y",
		"DISPLAY_NAME" => "Y",
		"DISPLAY_PICTURE" => "Y",
		"DISPLAY_PREVIEW_TEXT" => "Y",
		"DISPLAY_TOP_PAGER" => "N",
		"FIELD_CODE" => array(
			0 => "",
			1 => "",
		),
		"FILTER_NAME" => "",
		"HIDE_LINK_WHEN_NO_DETAIL" => "N",
		"IBLOCK_ID" => "7",
		"IBLOCK_TYPE" => "services",
		"INCLUDE_IBLOCK_INTO_CHAIN" => "Y",
		"INCLUDE_SUBSECTIONS" => "Y",
		"MESSAGE_404" => "",
		"NEWS_COUNT" => "",
		"PAGER_BASE_LINK_ENABLE" => "N",
		"PAGER_DESC_NUMBERING" => "N",
		"PAGER_DESC_NUMBERING_CACHE_TIME" => "36000",
		"PAGER_SHOW_ALL" => "N",
		"PAGER_SHOW_ALWAYS" => "N",
		"PAGER_TEMPLATE" => ".default",
		"PAGER_TITLE" => "Новости",
		"PARENT_SECTION" => "",
		"PARENT_SECTION_CODE" => "",
		"PREVIEW_TRUNCATE_LEN" => "",
		"PROPERTY_CODE" => array(
			0 => "",
			1 => "",
		),
		"SET_BROWSER_TITLE" => "Y",
		"SET_LAST_MODIFIED" => "N",
		"SET_META_DESCRIPTION" => "Y",
		"SET_META_KEYWORDS" => "Y",
		"SET_STATUS_404" => "N",
		"SET_TITLE" => "Y",
		"SHOW_404" => "N",
		"SORT_BY1" => "ACTIVE_FROM",
		"SORT_BY2" => "SORT",
		"SORT_ORDER1" => "DESC",
		"SORT_ORDER2" => "ASC",
		"STRICT_SECTION_CHECK" => "N",
		"COMPONENT_TEMPLATE" => "services"
	),
	false
);?>
    <div class="button-wrapper button-wrapper_center">
        <div class="button button_gold button-open-calculate-project" data-popup="calculate-project-popup">
            РАССЧИТАТЬ ПРОЕКТ
        </div>
    </div>
 </div>

    <template id="popup-services">
        <div class="popup-services-cover">
            <div class="popup-services__title">БРЕНДИНГ</div>
            <div class="popup-services__category">Аудит бренда</div>
            <div class="popup-services__desc">
                <p>
                    Это диагностика его ключевых параметров и характеристик для
                    понимания дальнейших путей развития. Прежде всего, он дает ответ
                    на вопрос: что сохранить и что изменить при ребрендинге.
                </p>
                <p>
                    В базовой версии аудита мы анализируем восприятие бренда;
                    целостность его образа в различных точках контакта с потребителем;
                    заметность бренда в конкурентном окружении. Особое внимание мы
                    уделяем анализу фирменного стиля и коммуникаций, поскольку это
                    именно та сфера, в которой нам предстоит работать. По итогам
                    аудита мы даем рекомендации по возможным направлениям развития
                    фирменного стиля бренда.
                </p>
                <p>
                    Если на момент проведения аудита маркетинговая стратегия уже
                    сформирована, мы сопоставляем цели и планы компании с текущим
                    образом бренда.
                </p>
                <p>
                    В расширенных версиях может быть проведен анализ ассортиментного
                    портфеля, пути потребителя, представленности в тех или иных
                    каналах продаж и коммуникаций и т.д. Набор параметров для анализа
                    определяется индивидуально для каждого проекта.
                </p>
            </div>
        </div>
    </template>



 <? require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/footer.php");?>