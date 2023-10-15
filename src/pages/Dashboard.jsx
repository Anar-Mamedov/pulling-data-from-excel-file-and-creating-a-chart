import React, { useState, useEffect, useRef } from "react";
import { Upload, Button, Modal, Input, Select, Typography } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";
import { Pie, Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";

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

  const handleAnalyseClick2 = () => {
    const lenIndex = tableData[0].indexOf("len");
    const statusIndex = tableData[0].indexOf("status");

    const sums = {
      0: 0,
      1: 0,
      2: 0,
    };

    tableData.slice(1).forEach((row) => {
      const status = row[statusIndex];
      const len = Number(row[lenIndex]);
      if (sums[status] !== undefined) {
        sums[status] += len;
      }
    });

    const data = {
      labels: ["0", "1", "2"],
      datasets: [
        {
          label: "Status üzrə len cəmi",
          data: [sums[0], sums[1], sums[2]],
          fill: false,
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          borderColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          borderWidth: 1,
        },
      ],
    };

    setChartData2(data);
    setChartKey((prevKey) => prevKey + 1);
  };

  const handleAnalyseClick = () => {
    chartDataRef.current = getChartData();
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

      const actionColumn = {
        title: "Actions",
        formatter: (cell, formatterParams, onRendered) => {
          return `<span class='edit-icon'>${editIconSVG}</span> <span class='delete-icon'>${deleteIconSVG}</span>`;
        },
        cellClick: (e, cell) => {
          const rowData = cell.getRow().getData();
          if (e.target.closest(".edit-icon")) {
            editRow(rowData.id);
          } else if (e.target.closest(".delete-icon")) {
            deleteRow(rowData.id);
          }
        },
      };

      columns.push(actionColumn);
      new Tabulator("#excel-table", {
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

  const getChartData = () => {
    const expectedColumns = ["id", "len", "wkt", "status"];
    const missingColumns = expectedColumns.filter((col) => !tableData[0].includes(col));

    if (missingColumns.length > 0) {
      console.error("Missing columns:", missingColumns.join(", "));
      return;
    }
    const totalRows = tableData.length - 1;
    let statusCounts = {
      0: 0,
      1: 0,
      2: 0,
    };

    tableData.slice(1).forEach((row) => {
      let statusIndex = tableData[0].indexOf("status");
      if (statusIndex === -1) {
        console.error("Status column not found!");
        return;
      }

      let statusValue = row[statusIndex];
      console.log("Status Value:", statusValue);

      if (statusValue !== undefined && statusValue !== "" && statusCounts[statusValue] !== undefined) {
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
    console.log(data);

    return data;
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
      <div id="excel-table"></div>
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
            <Bar key={chartKey} data={chartData2} options={{ responsive: true }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
