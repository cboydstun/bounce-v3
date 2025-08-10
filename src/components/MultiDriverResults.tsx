"use client";

import React, { useState } from "react";
import {
  MultiRouteResult,
  getDriverColor,
} from "../utils/multiDriverOptimization";
import { DeliverySchedule } from "./DeliverySchedule";
import GoogleRouteMap from "./GoogleRouteMap";
import RouteMap from "./RouteMap";
import {
  DistanceUnit,
  formatDistance,
  formatDuration,
} from "../utils/unitConversions";

interface MultiDriverResultsProps {
  multiRouteResult: MultiRouteResult;
  startAddress: string;
  startCoordinates: [number, number];
  units: DistanceUnit;
  useGoogleMaps: boolean;
  onUnitsChange: (units: DistanceUnit) => void;
  onMapTypeChange: (useGoogleMaps: boolean) => void;
}

const MultiDriverResults: React.FC<MultiDriverResultsProps> = ({
  multiRouteResult,
  startAddress,
  startCoordinates,
  units,
  useGoogleMaps,
  onUnitsChange,
  onMapTypeChange,
}) => {
  const [activeDriverTab, setActiveDriverTab] = useState(0);
  const [showAllRoutes, setShowAllRoutes] = useState(true);

  const activeRoutes = multiRouteResult.routes.filter(
    (route) => route.orders.length > 0,
  );

  return (
    <div className="mt-6">
      {/* Multi-Driver Summary */}
      <div className="bg-gray-100 p-4 rounded mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Multi-Driver Route Summary</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Units:</span>
            <button
              onClick={() => onUnitsChange("miles")}
              className={`px-3 py-1 text-sm rounded ${
                units === "miles"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Miles
            </button>
            <button
              onClick={() => onUnitsChange("kilometers")}
              className={`px-3 py-1 text-sm rounded ${
                units === "kilometers"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Kilometers
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Distance</p>
            <p className="text-lg font-semibold">
              {formatDistance(multiRouteResult.totalDistance, units)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Duration</p>
            <p className="text-lg font-semibold">
              {formatDuration(multiRouteResult.totalDuration)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Drivers</p>
            <p className="text-lg font-semibold">
              {multiRouteResult.routeStats.driversUsed} of{" "}
              {multiRouteResult.routes.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Stops</p>
            <p className="text-lg font-semibold">
              {multiRouteResult.routeStats.totalStops}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Average Stops per Driver</p>
            <p className="text-lg font-semibold">
              {multiRouteResult.routeStats.averageStopsPerDriver.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Distance per Driver</p>
            <p className="text-lg font-semibold">
              {formatDistance(
                multiRouteResult.routeStats.averageDistancePerDriver,
                units,
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Driver Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {multiRouteResult.routes.map((route, index) => (
              <button
                key={index}
                onClick={() => setActiveDriverTab(index)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeDriverTab === index
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                style={{
                  color:
                    activeDriverTab === index ? route.routeColor : undefined,
                  borderBottomColor:
                    activeDriverTab === index ? route.routeColor : undefined,
                }}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: route.routeColor }}
                  ></div>
                  <span>
                    Driver {index + 1}
                    {route.orders.length === 0 && (
                      <span className="text-xs text-gray-400 ml-1">
                        (No deliveries)
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {route.orders.length} stops
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Active Driver Route Details */}
        <div className="mt-6">
          {multiRouteResult.routes[activeDriverTab] && (
            <div>
              <div className="bg-white border rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor:
                        multiRouteResult.routes[activeDriverTab].routeColor,
                    }}
                  ></div>
                  <h3 className="text-lg font-semibold">
                    Driver {activeDriverTab + 1} Route Details
                  </h3>
                </div>

                {multiRouteResult.routes[activeDriverTab].orders.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Distance</p>
                      <p className="font-semibold">
                        {formatDistance(
                          multiRouteResult.routes[activeDriverTab]
                            .totalDistance,
                          units,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-semibold">
                        {formatDuration(
                          multiRouteResult.routes[activeDriverTab]
                            .totalDuration,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Stops</p>
                      <p className="font-semibold">
                        {multiRouteResult.routes[activeDriverTab].orders.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Start Time</p>
                      <p className="font-semibold">
                        {multiRouteResult.routes[
                          activeDriverTab
                        ].startTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No deliveries assigned to this driver.
                  </p>
                )}
              </div>

              {/* Individual Driver Schedule */}
              {multiRouteResult.routes[activeDriverTab].orders.length > 0 && (
                <DeliverySchedule
                  optimizedRoute={multiRouteResult.routes[activeDriverTab]}
                  startAddress={startAddress}
                  editable={false}
                  units={units}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Multi-Route Map */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Route Map</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showAllRoutes"
                checked={showAllRoutes}
                onChange={(e) => setShowAllRoutes(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showAllRoutes" className="text-sm text-gray-700">
                Show all routes
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Map Type:</span>
              <button
                onClick={() => onMapTypeChange(false)}
                className={`px-3 py-1 text-sm rounded ${
                  !useGoogleMaps
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Leaflet
              </button>
              <button
                onClick={() => onMapTypeChange(true)}
                className={`px-3 py-1 text-sm rounded ${
                  useGoogleMaps
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Google Maps
              </button>
            </div>
          </div>
        </div>

        {/* Route Legend */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Route Legend:
          </h4>
          <div className="flex flex-wrap gap-4">
            {activeRoutes.map((route, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: route.routeColor }}
                ></div>
                <span className="text-sm text-gray-600">
                  Driver {(route.driverIndex || 0) + 1} ({route.orders.length}{" "}
                  stops)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Display */}
        {showAllRoutes
          ? // Show all routes on one map
            activeRoutes.length > 0 &&
            (useGoogleMaps ? (
              <GoogleRouteMap
                contacts={[]} // Not used in multi-route mode
                optimizedOrder={[]} // Not used in multi-route mode
                routeGeometry={null} // Not used in multi-route mode
                startAddress={startAddress}
                startCoordinates={startCoordinates}
                multipleRoutes={{
                  routes: activeRoutes.map((route) => ({
                    contacts: route.deliveryOrder,
                    routeGeometry: route.routeGeometry,
                    color: route.routeColor || "#3B82F6",
                    driverIndex: route.driverIndex || 0,
                    visible: true,
                  })),
                }}
              />
            ) : (
              <RouteMap
                contacts={[]} // Not used in multi-route mode
                optimizedOrder={[]} // Not used in multi-route mode
                routeGeometry={null} // Not used in multi-route mode
                startAddress={startAddress}
                startCoordinates={startCoordinates}
                multipleRoutes={{
                  routes: activeRoutes.map((route) => ({
                    contacts: route.deliveryOrder,
                    routeGeometry: route.routeGeometry,
                    color: route.routeColor || "#3B82F6",
                    driverIndex: route.driverIndex || 0,
                    visible: true,
                  })),
                }}
              />
            ))
          : // Show individual route
            multiRouteResult.routes[activeDriverTab].orders.length > 0 &&
            (useGoogleMaps ? (
              <GoogleRouteMap
                contacts={
                  multiRouteResult.routes[activeDriverTab].deliveryOrder
                }
                optimizedOrder={
                  multiRouteResult.routes[activeDriverTab].deliveryOrder
                }
                routeGeometry={
                  multiRouteResult.routes[activeDriverTab].routeGeometry
                }
                startAddress={startAddress}
                startCoordinates={startCoordinates}
              />
            ) : (
              <RouteMap
                contacts={
                  multiRouteResult.routes[activeDriverTab].deliveryOrder
                }
                optimizedOrder={
                  multiRouteResult.routes[activeDriverTab].deliveryOrder
                }
                routeGeometry={
                  multiRouteResult.routes[activeDriverTab].routeGeometry
                }
                startAddress={startAddress}
                startCoordinates={startCoordinates}
              />
            ))}
      </div>

      {/* Driver Comparison Table */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Driver Comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stops
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {multiRouteResult.routes.map((route, index) => (
                <tr
                  key={index}
                  className={route.orders.length === 0 ? "bg-gray-50" : ""}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: route.routeColor }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900">
                        Driver {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {route.orders.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {route.orders.length > 0
                      ? formatDistance(route.totalDistance, units)
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {route.orders.length > 0
                      ? formatDuration(route.totalDuration)
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {route.orders.length > 0
                      ? route.startTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {route.orders.length > 0
                      ? route.endTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MultiDriverResults;
