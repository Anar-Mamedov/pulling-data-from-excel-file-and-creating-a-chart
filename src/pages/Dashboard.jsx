import React, { useState, useEffect, useRef } from "react";
import { Upload, Button, Modal, Input, Select, Typography } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";
import { Pie, Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { Map, View } from "ol";
import { Tile as TileLayer } from "ol/layer";
import { OSM as OSMSource } from "ol/source";
import { fromLonLat } from "ol/proj";
import WKT from "ol/format/WKT";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Stroke, Style } from "ol/style";

const { Text } = Typography;

function Dashboard() {
  const [tableData, setTableData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [lenValue, setLenValue] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const chartDataRef = useRef(null);
  const [pieChartKey, setPieChartKey] = useState(0);
  const [chartData2, setChartData2] = useState(null);
  const [chartKey, setChartKey] = useState(0);
  const tableRef = useRef(null);
  const barChartRef = useRef(null);
  const [map, setMap] = useState(null);
  const [view, setView] = useState(null);
  const mapRef = useRef(null);
  const [showMap, setShowMap] = useState(false);

  const handleAnalyseClick2 = () => {
    const rows = tableRef.current.getRows("active");
    const filteredData = rows.map((row) => row.getData());
    console.log("Filtered Data for Analysis 2:", filteredData);

    const lenIndex = tableData[0].indexOf("len");
    const statusIndex = tableData[0].indexOf("status");

    const lenSums = {
      0: 0,
      1: 0,
      2: 0,
    };

    filteredData.forEach((row) => {
      const status = row.status;
      const len = Number(row.len);
      if (lenSums[status] !== undefined) {
        lenSums[status] += len;
      }
    });

    const data = {
      labels: ["0", "1", "2"],
      datasets: [
        {
          label: "Status üzrə len cəmi",
          data: [lenSums[0], lenSums[1], lenSums[2]],
          fill: false,
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          borderColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          borderWidth: 1,
        },
      ],
    };

    console.log("Chart Data:", data);

    setChartData2(data);
    setChartKey((prevKey) => prevKey + 1);
  };

  const handleAnalyseClick = () => {
    const rows = tableRef.current.getRows("active");
    const filteredData = rows.map((row) => row.getData());
    console.log("Filtered Table Data:", filteredData);

    const chartData = getChartData(filteredData);
    if (!chartData) {
      return <div>Error generating chart data</div>;
    }
    chartDataRef.current = chartData;
    setShowChart(true);
    setPieChartKey((prevKey) => prevKey + 1);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const editRow = (rowId) => {
    const rowData = tableData.find((row) => row[0] === rowId);
    setLenValue(rowData[1]);
    setStatusValue(rowData[3]);
    setEditingRow(rowId);
    setIsModalVisible(true);
  };

  const deleteRow = (rowId) => {
    Modal.confirm({
      title: "Bu sıranı silmək istədiyinizə əminsiniz?",
      content: "Bu əməliyyat geri qaytarıla bilməz.",
      okText: "Bəli",
      okType: "danger",
      cancelText: "Xeyir",
      onOk: () => {
        const newData = tableData.filter((row) => row[0] !== rowId);
        setTableData(newData);
      },
      onCancel: () => {},
    });
  };

  const handleOk = () => {
    if (editingRow) {
      const rowIndex = tableData.findIndex((row) => row[0] === editingRow);
      tableData[rowIndex][1] = lenValue;
      tableData[rowIndex][3] = statusValue;
      setTableData([...tableData]);
      setEditingRow(null);
    } else {
      const newId = Math.max(...tableData.slice(1).map((row) => row[0])) + 1;

      let newRow = Array(tableData[0].length).fill("");

      newRow[0] = newId;
      newRow[1] = lenValue;
      newRow[3] = statusValue;

      setTableData((prevData) => [...prevData, newRow]);

      setIsModalVisible(false);
      setLenValue("");
      setStatusValue("");
    }
    setIsModalVisible(false);
    setLenValue("");
    setStatusValue("");
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setLenValue("");
    setStatusValue("");
  };

  const handleUpload = (file) => {
    console.log("File selected:", file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      console.log("File loaded:", evt);
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log("Parsed data:", data);
      setTableData(data);
    };
    reader.onerror = (error) => console.log("File reading error:", error);
    reader.readAsBinaryString(file);
    return false;
  };

  const columns = tableData[0]
    ? tableData[0].map((header, index) => {
        let columnDefinition = {
          title: header,
          field: header,
          headerFilter: "input",
        };

        if (index === 0) {
          columnDefinition.sorter = "number";
          columnDefinition.headerSort = true;
        }

        return columnDefinition;
      })
    : [];

  useEffect(() => {
    if (tableData.length > 0 && Tabulator) {
      const editIconSVG =
        '<svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M877.7 238.7a128 128 0 0 0-181.7 0L172.6 762a25.86 25.86 0 0 0-6.5 10.2L71.4 989.6a32.04 32.04 0 0 0 40.7 40.7l217.3-94.8a25.86 25.86 0 0 0 10.2-6.5l523.3-523.4c49.8-49.8 49.8-130.3 0-180.1zM334 863.1l-151.4 66.3L399.3 713l90.6 90.6-155.9 59.5zM781.2 416L642.8 554.4 551.1 462.7 689.6 323.3a31.92 31.92 0 0 1 45.2 0l46.3 46.3a31.92 31.92 0 0 1 0 45.2z"></path></svg>';
      const deleteIconSVG =
        '<svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M744 168H536V104c0-17.7-14.3-32-32-32h-192c-17.7 0-32 14.3-32 32v64H176c-4.4 0-8 3.6-8 8v40c0 4.4 3.6 8 8 8h568c4.4 0 8-3.6 8-8v-40c0-4.4-3.6-8-8-8zm-360-64h192v64h-192v-64z"></path><path d="M304 840c0 22.1 17.9 40 40 40h288c22.1 0 40-17.9 40-40V312H304v528zm160-372c0-4.4 3.6-8 8-8h64c4.4 0 8 3.6 8 8v296c0 4.4-3.6 8-8 8h-64c-4.4 0-8-3.6-8-8V468z"></path></svg>';
      const mapIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 11.5C11.337 11.5 10.7011 11.2366 10.2322 10.7678C9.76339 10.2989 9.5 9.66304 9.5 9C9.5 8.33696 9.76339 7.70107 10.2322 7.23223C10.7011 6.76339 11.337 6.5 12 6.5C12.663 6.5 13.2989 6.76339 13.7678 7.23223C14.2366 7.70107 14.5 8.33696 14.5 9C14.5 9.3283 14.4353 9.65339 14.3097 9.95671C14.1841 10.26 13.9999 10.5356 13.7678 10.7678C13.5356 10.9999 13.26 11.1841 12.9567 11.3097C12.6534 11.4353 12.3283 11.5 12 11.5ZM12 2C10.1435 2 8.36301 2.7375 7.05025 4.05025C5.7375 5.36301 5 7.14348 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 7.14348 18.2625 5.36301 16.9497 4.05025C15.637 2.7375 13.8565 2 12 2Z" fill="black"/></svg>`;

      const actionColumn = {
        title: "Actions",
        formatter: (cell, formatterParams, onRendered) => {
          return `<span class='edit-icon'>${editIconSVG}</span> <span class='delete-icon'>${deleteIconSVG}</span> <span class='map-icon'>${mapIconSVG}</span>`;
        },
        cellClick: (e, cell) => {
          const rowData = cell.getRow().getData();
          if (e.target.closest(".edit-icon")) {
            editRow(rowData.id);
          } else if (e.target.closest(".delete-icon")) {
            deleteRow(rowData.id);
          } else if (e.target.closest(".map-icon")) {
            handleMapIconClick(rowData.wkt);
          }
        },
      };

      columns.push(actionColumn);
      tableRef.current = new Tabulator("#excel-table", {
        data: tableData.slice(1).map((row) => {
          let obj = {};
          tableData[0].forEach((header, i) => {
            obj[header] = row[i];
          });
          return obj;
        }),
        columns: columns,
        pagination: "local",
        paginationSize: 30,
        initialSort: [{ column: "id", dir: "desc" }],
      });
    }
  }, [tableData]);

  const getChartData = (filteredData) => {
    if (!filteredData || !filteredData.length) {
      console.error("filteredData is empty or not provided");
      return null;
    }

    if (typeof filteredData[0] !== "object") {
      console.error("filteredData[0] is not an object:", filteredData[0]);
      return null;
    }

    const totalRows = filteredData.length;
    let statusCounts = {
      0: 0,
      1: 0,
      2: 0,
    };

    filteredData.forEach((row) => {
      let statusValue = row.status;
      if (statusValue !== undefined && statusCounts[statusValue] !== undefined) {
        statusCounts[statusValue]++;
      }
    });

    const data = {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          data: Object.values(statusCounts).map((count) => (count / totalRows) * 100),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        },
      ],
    };
    return data;
  };
  useEffect(() => {
    if (mapRef.current && !document.querySelector(".ol-viewport")) {
      let initialView = new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      });

      let mapInstance = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSMSource(),
          }),
        ],
        view: initialView,
        controls: [],
      });

      setMap(mapInstance);
      setView(initialView);
    }
  }, []);

  const handleMapIconClick = (wktString) => {
    const format = new WKT();
    const feature = format.readFeature(wktString, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    });

    map
      .getLayers()
      .getArray()
      .filter((layer) => layer instanceof VectorLayer)
      .forEach((layer) => map.removeLayer(layer));

    const vector = new VectorLayer({
      source: new VectorSource({
        features: [feature],
      }),
      style: new Style({
        stroke: new Stroke({
          color: "red",
          width: 2,
        }),
      }),
    });

    map.addLayer(vector);
    view.fit(feature.getGeometry().getExtent(), { padding: [100, 100, 100, 100] });
    setShowMap(true);

    setTimeout(() => {
      map.updateSize();
    }, 0);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <Upload beforeUpload={handleUpload} showUploadList={false}>
          <Button icon={<UploadOutlined />}>Load Excel File</Button>
        </Upload>
        <Button style={{ marginLeft: "10px" }} onClick={showModal}>
          Add New Data
        </Button>{" "}
      </div>

      <Modal title="Başlık" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <Text>Len Bilgisi Giriniz</Text>
        <Input value={lenValue} onChange={(e) => setLenValue(e.target.value)} style={{ margin: "10px 0 10px 0" }} />
        <Text>Status Seçiniz</Text>
        <Select
          value={statusValue}
          onChange={(value) => setStatusValue(value)}
          style={{ marginTop: "10px", width: "100%" }}>
          <Select.Option value="0">0</Select.Option>
          <Select.Option value="1">1</Select.Option>
          <Select.Option value="2">2</Select.Option>
        </Select>
      </Modal>
      <div style={{ display: "flex" }}>
        <div id="excel-table"></div>
        <div
          ref={mapRef}
          style={{ width: "500px", height: "500px", marginLeft: "10px", display: showMap ? "block" : "none" }}></div>
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "10px" }}>
        <Button onClick={handleAnalyseClick}>Analiz 1</Button>
        <Button onClick={handleAnalyseClick2}>Analiz 2</Button>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", marginTop: "10px" }}>
        {showChart && (
          <div style={{ width: "500px", height: "500px" }}>
            <Pie key={pieChartKey} data={chartDataRef.current} options={{ responsive: true }} />
          </div>
        )}
        {chartData2 && (
          <div style={{ width: "500px", height: "500px", display: "flex", alignItems: "flex-end" }}>
            <Bar ref={barChartRef} data={chartData2} options={{ responsive: true }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
