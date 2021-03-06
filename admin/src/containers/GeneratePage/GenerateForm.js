import React, {useState, useEffect} from 'react';
import {Button, InputSelect, InputNumber} from "strapi-helper-plugin";
import {convertModelToOption} from "../../utils/convertOptions";
import {find, get, map} from 'lodash';
import {FieldRow, FileField, FormAction} from "./ui-components";
import {readLocalFile} from "../../utils/file";
import JsonDataDisplay from "../../components/JsonDataDisplay";
import {generateData} from "../../utils/api";

const GenerateForm = ({models}) => {
  const options = map(models, convertModelToOption);
  options.splice(0, 0, {label: "-", value: "none"}); // add a "none" option because we don't want a content type selected by default
  const [loading, setLoading] = useState(false);
  const [targetModelUid, setTargetModel] = useState(undefined);
  const [sourceFile, setSourceFile] = useState(null);
  const [source, setSource] = useState(null);
  const [generateCount, setGenerateCount] = useState(undefined);

  const onTargetModelChange = (event) => {
    setTargetModel(event.target.value);
  };

  const onSourceFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setSource(null);
      setSourceFile(event.target.files[0])
    }
  };

  const onContentGenerateCountChange = (event) => {
    //console.log({onContentGenerateCountChange: event.target.value});
    setGenerateCount(event.target.value);
  };
  useEffect(() => {
    if (!generateCount) {
      //console.log("setting default generateCount");
      setGenerateCount(1);
    }
  });

  const upload = () => {
    if (!sourceFile) {
      strapi.notification.error("Please choose a source file first.");
      return;
    }
    setLoading(true);
    readLocalFile(sourceFile, JSON.parse).then(setSource)
    .catch((error) => {
      strapi.notification.error(
        "Something wrong when uploading the file, please check the file and try again.");
      console.error(error)
    }).finally(() => {
      setLoading(false);
    })
  };

  const submit = () => {
    if (!targetModelUid) {
      strapi.notification.error("Please select a target content type!");
      return;
    }
    if (!source) {
      strapi.notification.error("Please choose a source file first.");
      return;
    }
    if (!generateCount) {
      strapi.notification.error("Please set number of content items to generate.");
      return;
    }
    const model = find(models, (model) => model.uid === targetModelUid);
    setLoading(true);
    generateData({
      targetModel: model.uid,
      source,
      generateCount: generateCount,
      kind: get(model, 'schema.kind'),
    }).then(() => {
      strapi.notification.success("Generate succeeded!");
    }).catch((error) => {
      console.log(error);
      strapi.notification.error("Failed: " + error.message);
    }).finally(() => {
      setLoading(false);
    });
  };
  return (<div>
    <FieldRow>
      <label htmlFor="source">Content Template JSON File</label>
      <FileField>
        <input id="source"
               name="source"
               accept={".json"}
               type="file"
               onChange={onSourceFileChange}
        />
      </FileField>
    </FieldRow>
    {source
      ? (<JsonDataDisplay data={source}/>)
      : (<FormAction>
        <Button disabled={loading}
                onClick={upload}
                secondaryHotline>{loading ? "Please Wait..."
          : "Upload"}</Button>
      </FormAction>)
    }
    <FieldRow>
      <label htmlFor="target-content-generate-count">Number of Content to generate</label>
      <InputNumber name="targetContentGenerateCount"
                   id="target-content-generate-count"
                   value={generateCount}
                   onChange={onContentGenerateCountChange}/>
    </FieldRow>
    <FieldRow>
      <label htmlFor="target-content-type">Target Content Type</label>
      <InputSelect name="targetContentType"
                   id="target-content-type"
                   selectOptions={options}
                   value={targetModelUid}
                   onChange={onTargetModelChange}/>
    </FieldRow>
    <FormAction>
      <Button disabled={loading}
              onClick={submit}
              primary>{loading ? "Please Wait..." : "Generate"}</Button>
    </FormAction>
  </div>)
};

export default GenerateForm;
