
export interface SchoolProperties {
  GmlID?: string;
  OBJECTID: number;
  Dataset?: string;
  數據集?: string;
  Facility_Name?: string;
  Address?: string;
  設施名稱?: string;
  地址?: string;
  Students_Gender?: string;
  就讀學生性別?: string;
  Session?: string;
  學校授課時間?: string;
  District?: string;
  分區?: string;
  School_Level?: string;
  學校類型?: string;
  Finance_Type?: string;
  資助種類?: string;
  Religion?: string;
  宗教?: string;
  Telephone?: string;
  聯絡電話?: string;
  Fax_Number?: string;
  傳真號碼?: string;
  Website?: string;
  網頁?: string;
  SCHOOL_NO?: string;
  學校編號?: string;
  Northing___坐標北?: number;
  Easting___坐標東?: number;
  Latitude___緯度?: number;
  Longitude___經度?: number;
  Last_Updated_Date___最後更新日期?: string;
}

export interface SchoolGeometry {
  type: string;
  coordinates: number[];
}

export interface SchoolFeature {
  type: string;
  id?: string;
  geometry: SchoolGeometry;
  properties: SchoolProperties;
}

export interface SchoolGeoJSON {
  type: string;
  crs?: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: SchoolFeature[];
}


export const fetchSchoolData = async (options?: {
  maxFeatures?: number;
  schoolNo?: string;
  district?: string;
  useXmlFilter?: boolean;
}): Promise<SchoolGeoJSON> => {
  try {
    const maxFeatures = options?.maxFeatures || 10;
    const schoolNo = options?.schoolNo;
    const district = options?.district;
    const useXmlFilter = options?.useXmlFilter ?? true; 
    
    let url = `https://portal.csdi.gov.hk/server/services/common/edb_rcd_1629267205213_6391/MapServer/WFSServer?service=wfs&request=GetFeature&typenames=AIDED_PRS&outputFormat=geojson`;
    
    
    if (maxFeatures) {
      url += `&maxFeatures=${maxFeatures}`;
    }
    
    
    const filters: string[] = [];
    
    if (schoolNo) {
      if (useXmlFilter) {
        
        const xmlFilter = `<Filter><PropertyIsEqualTo><PropertyName>學校編號</PropertyName><Literal>'${schoolNo}'</Literal></PropertyIsEqualTo></Filter>`;
        url += `&filter=${encodeURIComponent(xmlFilter)}`;
      } else {
        
        filters.push(`SCHOOL_NO.='${schoolNo}'`);
      }
    }
    
    if (district) {
      if (useXmlFilter) {
        
        const xmlFilter = `<Filter><Or><PropertyIsEqualTo><PropertyName>District</PropertyName><Literal>'${district}'</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>分區</PropertyName><Literal>'${district}'</Literal></PropertyIsEqualTo></Or></Filter>`;
        url += `&filter=${encodeURIComponent(xmlFilter)}`;
      } else {
        filters.push(`District='${district}' OR 分區='${district}'`);
      }
    }
    
    
    if (!useXmlFilter && filters.length > 0) {
      url += `&CQL_FILTER=${filters.join(' AND ')}`;
    }
    
    console.log('Fetching data from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Data received:', data.features?.length, 'features');
    return data;
  } catch (error) {
    console.error('Error fetching school data:', error);
    throw error;
  }
};


export const fetchSchoolByNo = async (schoolNo: string): Promise<SchoolFeature | null> => {
  try {
    console.log('正在查詢學校編號:', schoolNo);
    
    
    const xmlFilter = `<Filter><PropertyIsEqualTo><PropertyName>學校編號</PropertyName><Literal>'${schoolNo}'</Literal></PropertyIsEqualTo></Filter>`;
    const encodedFilter = encodeURIComponent(xmlFilter);
    
    const url = `https://portal.csdi.gov.hk/server/services/common/edb_rcd_1629267205213_6391/MapServer/WFSServer?service=wfs&request=GetFeature&typenames=AIDED_PRS&outputFormat=geojson&filter=${encodedFilter}`;
    
    console.log('查詢URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: SchoolGeoJSON = await response.json();
    
    if (data.features && data.features.length > 0) {
      console.log('找到學校:', data.features[0].properties.設施名稱);
      return data.features[0];
    }
    
    console.log('未找到學校編號:', schoolNo);
    return null;
  } catch (error) {
    console.error('Error fetching school by number:', error);
    throw error;
  }
};


export const fetchSchoolByName = async (schoolName: string): Promise<SchoolFeature | null> => {
  try {
    console.log('正在用名稱查詢學校:', schoolName);
    
    
    const xmlFilter = `<Filter><Or><PropertyIsEqualTo><PropertyName>設施名稱</PropertyName><Literal>'${schoolName}'</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>Facility_Name</PropertyName><Literal>'${schoolName}'</Literal></PropertyIsEqualTo></Or></Filter>`;
    const encodedFilter = encodeURIComponent(xmlFilter);
    
    const url = `https://portal.csdi.gov.hk/server/services/common/edb_rcd_1629267205213_6391/MapServer/WFSServer?service=wfs&request=GetFeature&typenames=AIDED_PRS&outputFormat=geojson&filter=${encodedFilter}`;
    
    console.log('名稱查詢URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: SchoolGeoJSON = await response.json();
    
    if (data.features && data.features.length > 0) {
      console.log('用名稱找到學校:', data.features[0].properties.設施名稱);
      return data.features[0];
    }
    
    console.log('未找到學校名稱:', schoolName);
    return null;
  } catch (error) {
    console.error('Error fetching school by name:', error);
    throw error;
  }
};