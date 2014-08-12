<?php
namespace Craft;

class SmartMap_FreeGeoIpService extends BaseApplicationComponent
{

	private $_freegeoipApi = 'http://freegeoip.net/json/';

	// Look up geolocation data based on IP address
	public function lookupIpData($ip)
	{
		try
		{
			// Ping geo location service
			$results = $this->rawData($ip);
			// Populate "here" array
			craft()->smartMap->here = array(
				'ip'        => $results['ip'],
				'city'      => $results['city'],
				'state'     => $results['region_name'],
				'zipcode'   => $results['zipcode'],
				'country'   => $results['country_name'],
				'latitude'  => $results['latitude'],
				'longitude' => $results['longitude'],
			);
			// If valid IP, set cache & cookie
			if (craft()->smartMap->validIp(craft()->smartMap->here['ip'])) {
				craft()->smartMap->setGeoDataCookie($ip);
				craft()->smartMap->cacheGeoData(craft()->smartMap->here['ip'], 'FreeGeoIp.net');
			}
		}
		catch (\Exception $e)
		{
			$message = 'The request to FreeGeoIp.net failed: '.$e->getMessage();
			Craft::log($message, LogLevel::Warning);
		}
	}

	// Get raw API data
	public function rawData($ip = null)
	{
		$client = new \Guzzle\Http\Client($this->_freegeoipApi);
		return $client
			->get($ip)
			->send()
			->json();
	}

}