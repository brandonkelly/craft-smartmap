<?php
/**
 * Smart Map plugin for Craft CMS
 *
 * The most comprehensive proximity search and mapping tool for Craft.
 *
 * @author    Double Secret Agency
 * @link      https://www.doublesecretagency.com/
 * @copyright Copyright (c) 2014 Double Secret Agency
 */

namespace doublesecretagency\smartmap;

use yii\base\Event;

use Craft;
use craft\base\Plugin;
use craft\events\RegisterComponentTypesEvent;
use craft\events\RegisterTemplateRootsEvent;
use craft\events\RegisterUrlRulesEvent;
use craft\helpers\UrlHelper;
use craft\services\Fields;
use craft\services\Plugins;
use craft\web\UrlManager;
use craft\web\View;
use craft\web\twig\variables\CraftVariable;

use doublesecretagency\smartmap\fields\Address;
use doublesecretagency\smartmap\models\Settings;
use doublesecretagency\smartmap\services\SmartMapService;
use doublesecretagency\smartmap\services\FreeGeoIp;
use doublesecretagency\smartmap\services\Main;
use doublesecretagency\smartmap\services\MaxMind;
use doublesecretagency\smartmap\services\Variables;
use doublesecretagency\smartmap\variables\SmartMapVariable;
use doublesecretagency\smartmap\web\assets\SettingsAssets;
use doublesecretagency\smartmap\listeners\GetAddressFieldSchema;

/**
 * Class SmartMap
 * @since 3.0.0
 */
class SmartMap extends Plugin
{

    /** @event DetectLocationEvent The event that is triggered after the user's location has been detected. */
    const EVENT_AFTER_DETECT_LOCATION = 'afterDetectLocation';

    /** @var Plugin  $plugin  Self-referential plugin property. */
    public static $plugin;

    /** @var bool  $hasCpSettings  The plugin has a settings page. */
    public $hasCpSettings = true;

    /** @var bool  $schemaVersion  Current schema version of the plugin. */
    public $schemaVersion = '3.0.0';

    /** @inheritDoc */
    public function init()
    {
        parent::init();
        self::$plugin = $this;

        // Load plugin components
        $this->setComponents([
            'smartMap'           => SmartMapService::class,
            'smartMap_main'      => Main::class,
            'smartMap_freeGeoIp' => FreeGeoIp::class,
            'smartMap_maxMind'   => MaxMind::class,
            'smartMap_variables' => Variables::class,
        ]);

        // Register field type
        Event::on(
            Fields::class,
            Fields::EVENT_REGISTER_FIELD_TYPES,
            function (RegisterComponentTypesEvent $event) {
                $event->types[] = Address::class;
            }
        );

        // Register variables
        Event::on(
            CraftVariable::class,
            CraftVariable::EVENT_INIT,
            function (Event $event) {
                $variable = $event->sender;
                $variable->set('smartMap', SmartMapVariable::class);
            }
        );

        // Register site routes
        Event::on(
            UrlManager::class,
            UrlManager::EVENT_REGISTER_SITE_URL_RULES,
            function (RegisterUrlRulesEvent $event) {
                $debugRoute = $this->getSettings()->debugRoute;
                if (!$debugRoute) {$debugRoute = 'map/debug';}
                $event->rules[$debugRoute] = 'smart-map/debug';
            }
        );

        // Register CP site routes
        Event::on(
            Plugins::class,
            Plugins::EVENT_AFTER_INSTALL_PLUGIN,
            function (Event $event) {
                if ('smart-map' == $event->plugin->handle) {
                    $url = UrlHelper::cpUrl('smart-map/welcome');
                    Craft::$app->getResponse()->redirect($url)->send();
                }
            }
        );

        // Support for CraftQL plugin
        if (class_exists(\markhuot\CraftQL\CraftQL::class)) {
            Event::on(
                Address::class,
                'craftQlGetFieldSchema',
                [new GetAddressFieldSchema, 'handle']
            );
        }

    }

    /**
     * @return Settings  Plugin settings model.
     */
    protected function createSettingsModel()
    {
        return new Settings();
    }

    /**
     * @return string  The fully rendered settings template.
     */
    protected function settingsHtml(): string
    {
        $view = Craft::$app->getView();
        $view->registerAssetBundle(SettingsAssets::class);
        $overrideKeys = array_keys(Craft::$app->getConfig()->getConfigFromFile('smart-map'));
        return $view->renderTemplate('smart-map/settings', [
            'settings' => $this->getSettings(),
            'overrideKeys' => $overrideKeys,
            'docsUrl' => $this->documentationUrl,
        ]);
    }

}